import { pool } from "../db.js";
import { sendEmail } from "./email.js";
import { name_settings_db_name, name_settings_db_name_suffix } from "../constants.js";

export const notifyUserCredentials = async ({ userId, personId, password, event }) => {
  const { rows } = await pool.query(
    `SELECT p.email, p.first_name, p.family_name
     FROM person p JOIN user_credentials uc ON uc.person_id = p.id
     WHERE ${userId != null ? "uc.id" : "p.id"} = $1`,
    [userId ?? personId],
  );
  const person = rows[0];
  if (!person?.email?.trim()) return;
  const settings = global.customSettings ?? {};
  const databaseName = settings[name_settings_db_name + name_settings_db_name_suffix] ||
    [settings[name_settings_db_name], settings[name_settings_db_name_suffix]].filter(Boolean).join(" ") || "Database";
  const action = event === "passwordChanged" ? "Your password has been changed" : "Your user account has been created";
  await sendEmail({
    to: person.email.trim(),
    subject: `${databaseName}: ${action}`,
    text: [
      `Hello ${[person.first_name, person.family_name].filter(Boolean).join(" ") || "user"},`,
      "", `${action} in ${databaseName}.`, "",
      `Username: ${person.email.trim()}`,
      `Password: ${password}`, "",
      "If you need to change your password, you must contact the Administrator.",
    ].join("\n"),
  });
};

// Schedule only after persistence succeeds; never log the password or SMTP error payload.
export const scheduleUserCredentialsNotification = (details) => {
  void Promise.resolve().then(() => notifyUserCredentials(details)).catch(() => {
    console.error("User credential notification failed", { userId: details.userId, personId: details.personId });
  });
};


export const notifyUserStatus = async ({ userId, active }) => {
  const { rows } = await pool.query(
    `SELECT p.email, p.first_name, p.family_name
     FROM person p JOIN user_credentials uc ON uc.person_id = p.id
     WHERE uc.id = $1`, [userId],
  );
  const person = rows[0];
  if (!person?.email?.trim()) return;
  const settings = global.customSettings ?? {};
  const databaseName = settings[name_settings_db_name + name_settings_db_name_suffix] ||
    [settings[name_settings_db_name], settings[name_settings_db_name_suffix]].filter(Boolean).join(" ") || "Database";
  const status = active ? "activated" : "deactivated";
  await sendEmail({
    to: person.email.trim(),
    subject: `${databaseName}: your account has been ${status}`,
    text: [
      `Hello ${[person.first_name, person.family_name].filter(Boolean).join(" ") || "user"},`,
      "", `Your user account in ${databaseName} has been ${status}.`,
      `Username: ${person.email.trim()}`, "",
      active ? "You can now sign in using your existing credentials." : "You can no longer sign in while your account is inactive.",
      "Please contact the Administrator if you have questions or need assistance.",
    ].join("\n"),
  });
};

export const scheduleUserStatusNotification = (details) => {
  void Promise.resolve().then(() => notifyUserStatus(details)).catch(() => {
    console.error("User status notification failed", { userId: details.userId });
  });
};
