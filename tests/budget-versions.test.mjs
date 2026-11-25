// Runs the real save statements against PostgreSQL when PECULE_TEST_DATABASE_URL is set
// (a throwaway database: tables are created with a random prefix and dropped afterwards).
import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import {
  budgetSaveStatement,
  budgetVersionsSchema,
  budgetVersionsListStatement,
  versionsTable,
  VERSION_RECENT,
} from "../lib/budget-storage.ts";

const url = process.env.PECULE_TEST_DATABASE_URL;
const prefix = `pecule_test_${process.pid}_`;
const budgets = `${prefix}budgets`;
const versions = versionsTable(budgets);
const user = "user-a";
const payload = (n) => JSON.stringify({ transactions: Array.from({ length: n }, (_, i) => ({ id: `t${i}` })) });

test("version table name follows the budgets prefix", () => {
  assert.equal(versionsTable("pecule_git_budgets"), "pecule_git_budget_versions");
  assert.equal(versionsTable("pecule_preview_budgets"), "pecule_preview_budget_versions");
});

test(
  "saves archive the replaced budget and keep a bounded history",
  { skip: !url && "PECULE_TEST_DATABASE_URL not set" },
  async (t) => {
    const pool = new pg.Pool({ connectionString: url, max: 2 });
    t.after(async () => {
      await pool.query(`DROP TABLE IF EXISTS ${budgets}, ${versions}`);
      await pool.end();
    });
    await pool.query(`CREATE TABLE ${budgets} (user_id text PRIMARY KEY, payload text NOT NULL,
    revision integer NOT NULL, updated_at text NOT NULL, last_operation_at timestamptz)`);
    await pool.query(budgetVersionsSchema(versions));
    const save = (revision, body, at) =>
      pool.query(
        budgetSaveStatement(budgets, revision === 0, true),
        revision === 0 ? [user, body, at] : [user, body, at, revision],
      );

    // First save: nothing to archive.
    assert.equal((await save(0, payload(0), "2026-01-01T10:00:00.000Z")).rowCount, 1);
    assert.equal((await pool.query(`SELECT count(*)::int n FROM ${versions}`)).rows[0].n, 0);

    // Second save archives revision 1 with its own save time.
    assert.equal((await save(1, payload(1), "2026-01-01T11:00:00.000Z")).rowCount, 1);
    let rows = (await pool.query(`SELECT revision, payload, saved_at FROM ${versions}`)).rows;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].revision, 1);
    assert.equal(rows[0].payload, payload(0));
    assert.equal(new Date(rows[0].saved_at).toISOString(), "2026-01-01T10:00:00.000Z");

    // A stale revision (conflict) writes nothing and archives nothing.
    assert.equal((await save(1, payload(9), "2026-01-01T12:00:00.000Z")).rowCount, 0);
    assert.equal((await pool.query(`SELECT count(*)::int n FROM ${versions}`)).rows[0].n, 1);
    assert.equal((await pool.query(`SELECT revision FROM ${budgets}`)).rows[0].revision, 2);

    // Many saves on the same day: only the recent window survives for that day,
    // older days keep their last save.
    let revision = 2;
    const day = (d, h) => `2026-01-${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}:00:00.000Z`;
    for (let d = 2; d <= 5; d++)
      for (let h = 8; h < 20; h++) {
        assert.equal((await save(revision, payload(revision), day(d, h))).rowCount, 1);
        revision++;
      }
    for (let i = 0; i < VERSION_RECENT + 10; i++) {
      assert.equal(
        (await save(revision, payload(revision), day(6, 8).replace("08:00", `08:${String(i).padStart(2, "0")}`)))
          .rowCount,
        1,
      );
      revision++;
    }
    rows = (await pool.query(`SELECT revision, saved_at FROM ${versions} ORDER BY revision`)).rows;
    const current = revision; // stored revision
    const recent = rows.filter((r) => r.revision > current - 1 - VERSION_RECENT);
    assert.ok(recent.length >= VERSION_RECENT - 1, `recent window kept (${recent.length})`);
    const parisDay = (d) => new Date(d).toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
    const older = rows.filter((r) => r.revision <= current - 1 - VERSION_RECENT);
    const perDay = Object.groupBy(older, (r) => parisDay(r.saved_at));
    for (const [d, list] of Object.entries(perDay)) assert.equal(list.length, 1, `one version kept for ${d}`);
    for (const d of ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04", "2026-01-05"])
      assert.ok(perDay[d], `day ${d} still restorable`);

    // Another user's saves never touch this history.
    await pool.query(budgetSaveStatement(budgets, true, true), ["user-b", payload(0), day(6, 9)]);
    await pool.query(budgetSaveStatement(budgets, false, true), ["user-b", payload(1), day(6, 10), 1]);
    const mine = (await pool.query(budgetVersionsListStatement(versions), [user])).rows;
    assert.equal(mine.length, rows.length);
    assert.equal(mine[0].revision, current - 1);
    assert.equal(Number(mine[0].transactions), current - 2);

    // Pruning stays bounded after old days expire.
    await save(revision, payload(1), "2026-04-01T08:00:00.000Z");
    const left = (
      await pool.query(`SELECT saved_at FROM ${versions} WHERE user_id=$1 AND revision<=$2`, [
        user,
        revision - VERSION_RECENT,
      ])
    ).rows;
    for (const r of left) assert.ok(new Date(r.saved_at) >= new Date("2026-01-31T00:00:00Z"), "expired days pruned");
  },
);
