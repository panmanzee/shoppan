/**
 * Thin nodemailer wrapper.
 * Skips silently if SMTP_HOST is not configured (dev without email server).
 *
 * To test locally: use Ethereal (https://ethereal.email) free SMTP or
 * set SMTP_HOST=smtp.gmail.com with an App Password.
 * In production: set to your SendGrid / AWS SES / Postmark SMTP relay.
 */
import nodemailer from "nodemailer";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";

function createTransport() {
  if (!env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER
      ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
      : undefined,
  });
}

const transport = createTransport();

async function send(opts: { to: string; subject: string; html: string }) {
  if (!transport) {
    logger.debug({ to: opts.to, subject: opts.subject }, "Email skipped (SMTP not configured)");
    return;
  }
  try {
    await transport.sendMail({ from: env.EMAIL_FROM, ...opts });
  } catch (err) {
    logger.error({ err, to: opts.to }, "Failed to send email");
  }
}

export async function sendOrderConfirmation(opts: {
  buyerEmail: string;
  buyerName: string;
  orderId: string;
  items: { title: string; quantity: number; unitPriceCents: number }[];
  totalCents: number;
}) {
  const rows = opts.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:6px 0;border-bottom:1px solid #f1ece4">${i.title}</td>
          <td style="padding:6px 0;border-bottom:1px solid #f1ece4;text-align:center">×${i.quantity}</td>
          <td style="padding:6px 0;border-bottom:1px solid #f1ece4;text-align:right">$${(i.unitPriceCents / 100).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1814">
      <h2 style="font-size:22px;margin-bottom:4px">Order confirmed ✓</h2>
      <p style="color:#8a8782;font-size:14px">Hi ${opts.buyerName}, thanks for shopping on Shoppan!</p>
      <p style="font-size:13px;color:#8a8782">Order #${opts.orderId.slice(-8).toUpperCase()}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px">
        <thead>
          <tr style="color:#8a8782;font-size:12px;text-transform:uppercase">
            <th style="text-align:left;padding-bottom:6px">Item</th>
            <th style="padding-bottom:6px">Qty</th>
            <th style="text-align:right;padding-bottom:6px">Price</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:12px;text-align:right;font-weight:600;font-size:15px">
        Total: $${(opts.totalCents / 100).toFixed(2)}
      </div>
      <p style="margin-top:24px;font-size:13px;color:#8a8782">
        You can track your orders at <a href="https://shoppan.com/dashboard/buyer" style="color:#5b4fe8">your dashboard</a>.
      </p>
    </div>`;

  await send({
    to: opts.buyerEmail,
    subject: `Your Shoppan order is confirmed (#${opts.orderId.slice(-8).toUpperCase()})`,
    html,
  });
}

export async function sendFulfillmentNotification(opts: {
  buyerEmail: string;
  buyerName: string;
  orderId: string;
  storeName: string;
}) {
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1814">
      <h2 style="font-size:22px;margin-bottom:4px">Your order has shipped 📦</h2>
      <p style="font-size:14px;color:#8a8782">Hi ${opts.buyerName},</p>
      <p style="font-size:14px"><strong>${opts.storeName}</strong> has marked your order as fulfilled.</p>
      <p style="font-size:13px;color:#8a8782">Order #${opts.orderId.slice(-8).toUpperCase()}</p>
      <a href="https://shoppan.com/dashboard/buyer"
         style="display:inline-block;margin-top:16px;background:#1a1814;color:#fff;padding:10px 22px;border-radius:99px;font-size:13px;font-weight:600;text-decoration:none">
        View your orders
      </a>
    </div>`;

  await send({
    to: opts.buyerEmail,
    subject: `Your Shoppan order has been fulfilled`,
    html,
  });
}