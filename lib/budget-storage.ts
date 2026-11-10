/** The table identifier is supplied only by the server's fixed environment prefix. */
export function budgetSaveStatement(table:string,initial:boolean){
 // Compare explicit IDs in the same successful write: stale revisions and retries
 // cannot register activity. Materialized rule occurrences are not a manual capture.
 const newOperation=initial
  ? `EXISTS (SELECT 1 FROM jsonb_array_elements($2::text::jsonb->'transactions') AS incoming(value) WHERE incoming.value->>'ruleId' IS NULL)`
  : `EXISTS (SELECT 1 FROM jsonb_array_elements($2::text::jsonb->'transactions') AS incoming(value)
      LEFT JOIN jsonb_array_elements(payload::jsonb->'transactions') AS previous(value)
      ON previous.value->>'id'=incoming.value->>'id'
      WHERE previous.value IS NULL AND incoming.value->>'ruleId' IS NULL)`;
 return initial
  ? `INSERT INTO ${table} (user_id,payload,revision,updated_at,last_operation_at)
     VALUES ($1,$2,1,$3,CASE WHEN ${newOperation} THEN $3::text::timestamptz ELSE NULL END)
     ON CONFLICT (user_id) DO NOTHING RETURNING revision`
  : `UPDATE ${table} SET payload=$2,revision=revision+1,updated_at=$3,
     last_operation_at=CASE WHEN ${newOperation} THEN $3::text::timestamptz ELSE last_operation_at END
     WHERE user_id=$1 AND revision=$4 RETURNING revision`;
}

/** Recheck activity and the inspected budget revision immediately before sending. */
export function dailyReminderClaimStatement(devices:string,budgets:string){
 return `UPDATE ${devices} d SET last_sent_date=$2,last_status='sending' FROM ${budgets} b
 WHERE d.id=$1 AND b.user_id=d.user_id AND b.revision=$3
 AND d.last_sent_date IS DISTINCT FROM $2
 AND (b.last_operation_at IS NULL OR (b.last_operation_at AT TIME ZONE 'Europe/Paris')::date<>$2::text::date)
 RETURNING d.id`;
}
