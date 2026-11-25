/** Versions kept for every budget: the most recent saves, then the last save of each day. */
export const VERSION_RECENT = 30;
export const VERSION_DAYS = 60;

/** Version history table for a budgets table (same fixed server prefix). */
export const versionsTable = (budgets: string) => budgets.replace(/budgets$/, "budget_versions");

export function budgetVersionsSchema(versions: string) {
  return `CREATE TABLE IF NOT EXISTS ${versions} (
      user_id text NOT NULL, revision integer NOT NULL, payload text NOT NULL,
      saved_at timestamptz NOT NULL, PRIMARY KEY (user_id, revision)
    )`;
}

/** The table identifier is supplied only by the server's fixed environment prefix. */
export function budgetSaveStatement(table: string, initial: boolean, metadataAware = true) {
  // Compare explicit IDs in the same successful write: stale revisions and retries
  // cannot register activity. Materialized rule occurrences are not a manual capture.
  const newOperation = initial
    ? `EXISTS (SELECT 1 FROM jsonb_array_elements($2::text::jsonb->'transactions') AS incoming(value) WHERE incoming.value->>'ruleId' IS NULL)`
    : `EXISTS (SELECT 1 FROM jsonb_array_elements($2::text::jsonb->'transactions') AS incoming(value)
      LEFT JOIN jsonb_array_elements(payload::jsonb->'transactions') AS previous(value)
      ON previous.value->>'id'=incoming.value->>'id'
      WHERE previous.value IS NULL AND incoming.value->>'ruleId' IS NULL)`;
  return initial
    ? `INSERT INTO ${table} (user_id,payload,revision,updated_at,last_operation_at)
     VALUES ($1,$2,1,$3,CASE WHEN ${newOperation} THEN $3::text::timestamptz ELSE NULL END)
     ON CONFLICT (user_id) DO NOTHING RETURNING revision`
    : `WITH previous AS (SELECT user_id,payload,revision,updated_at FROM ${table} WHERE user_id=$1 AND revision=$4),
     saved AS (UPDATE ${table} SET payload=$2,revision=revision+1,updated_at=$3,
     last_operation_at=CASE WHEN ${newOperation} THEN $3::text::timestamptz ELSE last_operation_at END
     WHERE user_id=$1 AND revision=$4 ${
       metadataAware
         ? ""
         : `AND jsonb_array_length(COALESCE(payload::jsonb#>'{settings,importProfiles}','[]'::jsonb))=0
     AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(payload::jsonb->'transactions') AS t(value)
       WHERE jsonb_array_length(COALESCE(t.value->'bankLinks','[]'::jsonb))>0)`
     } RETURNING revision),
     archived AS (INSERT INTO ${versionsTable(table)} (user_id,revision,payload,saved_at)
       SELECT user_id,revision,payload,updated_at::timestamptz FROM previous WHERE EXISTS (SELECT 1 FROM saved)
       ON CONFLICT (user_id,revision) DO NOTHING),
     pruned AS (${pruneVersions(versionsTable(table))})
     SELECT revision FROM saved`;
}

/** Older than the recent window: keep only each day's last save, for a limited number of days. */
function pruneVersions(versions: string) {
  return `DELETE FROM ${versions} v WHERE v.user_id=$1 AND v.revision<=$4-${VERSION_RECENT}
       AND EXISTS (SELECT 1 FROM saved)
       AND (v.saved_at < $3::text::timestamptz - interval '${VERSION_DAYS} days'
         OR EXISTS (SELECT 1 FROM ${versions} later WHERE later.user_id=v.user_id AND later.revision>v.revision
           AND (later.saved_at AT TIME ZONE 'Europe/Paris')::date=(v.saved_at AT TIME ZONE 'Europe/Paris')::date))`;
}

/** Recheck activity and the inspected budget revision immediately before sending. */
export function dailyReminderClaimStatement(devices: string, budgets: string) {
  return `UPDATE ${devices} d SET last_sent_date=$2,last_status='sending' FROM ${budgets} b
 WHERE d.id=$1 AND b.user_id=d.user_id AND b.revision=$3
 AND d.last_sent_date IS DISTINCT FROM $2
 AND (b.last_operation_at IS NULL OR (b.last_operation_at AT TIME ZONE 'Europe/Paris')::date<>$2::text::date)
 RETURNING d.id`;
}

/** Summaries only: the list never sends whole budgets. */
export function budgetVersionsListStatement(versions: string) {
  return `SELECT revision, saved_at,
      COALESCE(json_array_length(payload::json->'transactions'),0) AS transactions,
      octet_length(payload) AS size
    FROM ${versions} WHERE user_id=$1 ORDER BY revision DESC LIMIT 200`;
}
