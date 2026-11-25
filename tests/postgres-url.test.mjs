import test from "node:test";
import assert from "node:assert/strict";
import { explicitSslMode } from "../lib/postgres.ts";

test("aliased SSL modes are pinned to the verify-full behaviour pg already applies", () => {
  for (const mode of ["prefer", "require", "verify-ca"])
    assert.equal(
      new URL(
        explicitSslMode(`postgresql://u:p@db.example.com/neondb?sslmode=${mode}&channel_binding=require`),
      ).searchParams.get("sslmode"),
      "verify-full",
    );
});

test("explicit, opted-out and local connection strings are left untouched", () => {
  for (const url of [
    "postgresql://u:p@db.example.com/neondb?sslmode=verify-full",
    "postgresql://u:p@db.example.com/neondb?sslmode=disable",
    "postgresql://u:p@db.example.com/neondb?uselibpqcompat=true&sslmode=require",
    "postgresql://postgres@localhost:5433/postgres?host=/var/tmp/pg",
    "not a url",
  ])
    assert.equal(explicitSslMode(url), url);
});

test("credentials and other parameters survive", () => {
  const out = new URL(
    explicitSslMode("postgresql://user:p%40ss@db.example.com:5432/neondb?sslmode=require&channel_binding=require"),
  );
  assert.equal(out.username, "user");
  assert.equal(out.password, "p%40ss");
  assert.equal(out.searchParams.get("channel_binding"), "require");
});
