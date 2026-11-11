import nodemailer from "nodemailer";

// Create the transport lazily so missing SMTP configuration cannot prevent API startup.
let transporter;
export const sendEmail = async ({ to, subject, text }) => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
  const port = Number(SMTP_PORT);
  if (!SMTP_HOST || !Number.isInteger(port) || port < 1 || port > 65535 ||
      !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM) {
    const error = new Error("SMTP configuration is incomplete");
    error.code = "SMTP_CONFIGURATION";
    throw error;
  }
  transporter ??= nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  return transporter.sendMail({ from: SMTP_FROM, to, subject, text });
};
