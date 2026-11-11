import { pool } from "../db.js";
import { getAdminUsers } from "../controllers/user.controllers.js";
import { getPersonById } from "../controllers/person.controllers.js";
import { name_settings_db_name, name_settings_db_name_suffix } from "../constants.js";
import { sendEmail } from "./email.js";

export const notifyAdminsOfBatchSubmission = async ({ batchId, batchName, batchTypeId, personId }) => {
  const admins = await getAdminUsers();
  const recipients = [...new Set(admins.map((admin) => admin.email?.trim()).filter(Boolean))];
  if (!recipients.length) {
    console.warn("Batch notification skipped: no active administrators with email addresses", { batchId });
    return;
  }
  const [person, { rows }] = await Promise.all([
    getPersonById(personId),
    pool.query("SELECT name FROM batch_type WHERE id = $1", [batchTypeId]),
  ]);
  const settings = global.customSettings ?? {};
  const databaseName = settings[name_settings_db_name + name_settings_db_name_suffix] ||
    [settings[name_settings_db_name], settings[name_settings_db_name_suffix]].filter(Boolean).join(" ") || "Database";
  const batchType = rows[0]?.name ?? `Unknown batch type (ID: ${batchTypeId})`;
  const personName = [person?.first_name, person?.family_name].filter(Boolean).join(" ") || `Person ID: ${personId}`;
  const subject = `${databaseName}: new batch submitted`;
  const text = [
    `A new batch has been submitted to ${databaseName}.`,
    "",
    `Batch ID: ${batchId}`,
    `Batch name: ${batchName || "Not provided"}`,
    `Batch type: ${batchType}`,
    `Submitted by: ${personName}`,
    `Uploader email: ${person?.email || "Not available"}`,
    "",
    "Please review the submitted batch in the system.",
  ].join("\n");

  // Separate messages keep administrators' addresses private and isolate delivery failures.
  const results = await Promise.allSettled(recipients.map((to) => sendEmail({ to, subject, text })));
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Batch notification delivery failed", { batchId, code: result.reason?.code ?? "EMAIL_DELIVERY_ERROR" });
    }
  }
};

/** Notify the uploader, and administrators for execution outcomes, independently. */
export const notifyBatchStatusChange = async ({ batch, outcome }) => {
  const settings = global.customSettings ?? {};
  const databaseName = settings[name_settings_db_name + name_settings_db_name_suffix] ||
    [settings[name_settings_db_name], settings[name_settings_db_name_suffix]].filter(Boolean).join(" ") || "Database";
  const { rows } = await pool.query("SELECT name FROM batch_type WHERE id = $1", [batch.batch_type_id]);
  const batchType = rows[0]?.name ?? `Batch type ID: ${batch.batch_type_id}`;
  const status = { rejected: "rejected during curation", completed: "completed successfully", failed: "failed during execution" }[outcome];
  const subject = `${databaseName}: batch ${batch.id} ${status}`;
  const common = [
    `The batch process has ${status}.`,
    "",
    `Database: ${databaseName}`,
    `Batch ID: ${batch.id}`,
    `Batch name: ${batch.name || "Not provided"}`,
    `Batch type: ${batchType}`,
  ];
  if (outcome === "rejected" && batch.curator_notes) common.push(`Curator notes: ${batch.curator_notes}`);
  if (outcome === "failed") common.push("Please consult the batch process logs in the system for details.");

  const deliver = async (recipients, lines) => {
    const addresses = [...new Set(recipients.map((email) => email?.trim()).filter(Boolean))];
    await Promise.all(addresses.map(async (to) => {
      try {
        await sendEmail({ to, subject, text: lines.join("\n") });
      } catch (error) {
        console.error("Batch status email delivery failed", { batchId: batch.id, outcome, code: error?.code ?? "EMAIL_DELIVERY_ERROR" });
      }
    }));
  };
  // A failed lookup or delivery for one audience must not prevent the other audience.
  const tasks = [async () => {
    const person = await getPersonById(batch.uploaded_by_person_id);
    const lines = [...common];
    if (outcome === "completed") lines.push("", "The uploaded organisms data may take some time to appear. Materialized views are refreshed automatically once per day, or sooner if an administrator refreshes them manually.");
    await deliver([person?.email], lines);
  }];
  if (outcome !== "rejected") tasks.push(async () => {
    const admins = await getAdminUsers();
    const lines = [...common, `Uploader person ID: ${batch.uploaded_by_person_id}`];
    if (outcome === "completed") lines.push("", 'Please refresh the materialized views by pressing the corresponding refresh button in the "Batch processes" console so the updated data becomes visible.');
    await deliver(admins.map((admin) => admin.email), lines);
  });
  const results = await Promise.allSettled(tasks.map((task) => task()));
  for (const result of results) {
    if (result.status === "rejected") console.error("Batch status notification failed", { batchId: batch.id, outcome, code: result.reason?.code ?? "NOTIFICATION_ERROR" });
  }
};
