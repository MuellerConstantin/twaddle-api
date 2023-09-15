import nodemailer from 'nodemailer';
import env from './env';
import logger from './logger';

const transport = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure,
  auth: env.smtp.user
    ? {
        user: env.smtp.user,
        pass: env.smtp.password,
      }
    : undefined,
});

/**
 * Send a text mail.
 *
 * @param {string} receiver The receiver's email address
 * @param {string} sender The sender's email address
 * @param {string} subject The subject of the mail
 * @param {string} body The body of the mail
 */
export async function sendTextMail(receiver, sender, subject, body) {
  logger.debug(`Sending mail to ${receiver} from ${sender} with subject '${subject}'`);

  await transport.sendMail({
    from: sender,
    to: receiver,
    subject,
    text: body,
  });
}

/**
 * Send a HTML mail.
 *
 * @param {string} receiver The receiver's email address
 * @param {string} sender The sender's email address
 * @param {string} subject The subject of the mail
 * @param {string} body The body of the mail
 */
export async function sendHtmlMail(receiver, sender, subject, body) {
  logger.debug(`Sending mail to ${receiver} from ${sender} with subject '${subject}'`);

  await transport.sendMail({
    from: sender,
    to: receiver,
    subject,
    html: body,
  });
}
