const RESEND_API_URL = "https://api.resend.com/emails";
const FROM = "OKIKE <noreply@okikeenterprises.com>";
const ADMIN_EMAIL = "okikeenterprises@gmail.com"; // update to your preferred admin inbox

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping email");
    return;
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      html: payload.html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[email] Resend error (${res.status}):`, err);
  }
}

// ─── Base template ────────────────────────────────────────────────────────────

function baseTemplate(content: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>OKIKE</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f4;">
  <tr><td align="center" style="padding:32px 16px;">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-top:4px solid #eab308;">
      <tr>
        <td style="padding:28px 40px 20px;">
          <span style="font-size:26px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;color:#111111;">OKI</span><span style="font-size:26px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;color:#eab308;">KE</span>
          <br/>
          <span style="font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#999999;">Your Digital Ecosystem</span>
        </td>
      </tr>
      <tr><td style="padding:0 40px;"><div style="height:2px;background-color:#eab308;"></div></td></tr>
      <tr><td style="padding:32px 40px;">${content}</td></tr>
      <tr>
        <td style="padding:20px 40px 32px;border-top:1px solid #f0f0f0;text-align:center;">
          <p style="font-size:12px;color:#999999;margin:0;">&copy; ${year} OKIKE Enterprises &nbsp;&middot;&nbsp; <a href="https://okikeenterprises.com" style="color:#eab308;text-decoration:none;">okikeenterprises.com</a></p>
          <p style="font-size:11px;color:#bbbbbb;margin:6px 0 0;">You're receiving this because you interacted with OKIKE.</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ─── Reusable snippet helpers ─────────────────────────────────────────────────

function infoCard(rows: string[]): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fafafa;border-left:4px solid #eab308;margin:20px 0;">
    <tr><td style="padding:16px 20px;">${rows.join("\n")}</td></tr>
  </table>`;
}

function infoRow(label: string, value: string): string {
  return `<p style="margin:4px 0;font-size:14px;color:#444444;"><strong style="color:#111111;">${label}:</strong> ${value}</p>`;
}

function ctaButton(text: string, href: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;">
    <tr><td style="background-color:#eab308;">
      <a href="${href}" style="display:inline-block;padding:14px 32px;font-size:12px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:#000000;text-decoration:none;">${text} &rarr;</a>
    </td></tr>
  </table>`;
}

function h1(text: string): string {
  return `<h1 style="font-size:28px;font-weight:800;color:#111111;margin:0 0 12px;line-height:1.15;">${text}</h1>`;
}

function para(text: string): string {
  return `<p style="font-size:15px;line-height:1.7;color:#555555;margin:0 0 14px;">${text}</p>`;
}

function featureRow(icon: string, title: string, desc: string): string {
  return `<tr>
    <td style="padding:10px 0;vertical-align:top;width:32px;">
      <div style="width:28px;height:28px;background-color:#eab308;display:inline-flex;align-items:center;justify-content:center;font-size:14px;">${icon}</div>
    </td>
    <td style="padding:10px 0 10px 12px;vertical-align:top;">
      <p style="font-size:14px;font-weight:700;color:#111111;margin:0 0 2px;">${title}</p>
      <p style="font-size:13px;color:#666666;margin:0;">${desc}</p>
    </td>
  </tr>`;
}

// ─── Email templates ──────────────────────────────────────────────────────────

export function welcomeEmail(data: { name: string; email: string }): EmailPayload {
  const firstName = data.name.split(" ")[0];
  return {
    to: data.email,
    subject: `Welcome to OKIKE, ${firstName} 👋`,
    html: baseTemplate(`
      <p style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#eab308;margin:0 0 8px;">Welcome</p>
      ${h1(`Good to have you, ${firstName}.`)}
      ${para("Your OKIKE account is ready. You can now scope projects, track progress in real time, and work directly with our team.")}
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fafafa;border-left:4px solid #eab308;margin:20px 0;">
        <tr><td style="padding:16px 20px;">
          <p style="font-size:13px;font-weight:700;color:#111;margin:0 0 12px;">Here's what you can do:</p>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            ${featureRow("🚀", "Start a project", "Describe what you want to build and get a fixed-price proposal within 24 hours.")}
            ${featureRow("📊", "Track progress", "See milestones, updates, and your project stage in real time from your dashboard.")}
            ${featureRow("🤖", "Ask OKIKE AI", "Your AI assistant can answer questions about your projects and suggest next steps.")}
            ${featureRow("🎓", "Explore the Academy", "Learn fullstack development, UI/UX, and more through our structured courses.")}
          </table>
        </td></tr>
      </table>
      ${ctaButton("Go to Dashboard", "https://okikeenterprises.com/dashboard")}
      ${para(`Questions? We're always here — <a href="mailto:support@okikeenterprises.com" style="color:#eab308;">support@okikeenterprises.com</a>`)}
    `),
  };
}

export function inquiryAdminEmail(data: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  project_type: string;
  budget?: string;
  timeline?: string;
  details: string;
  package_name?: string;
  total?: number | null;
}): EmailPayload {
  const rows = [
    infoRow("Name", data.name),
    infoRow("Email", `<a href="mailto:${data.email}" style="color:#eab308;">${data.email}</a>`),
    data.phone ? infoRow("Phone", data.phone) : "",
    data.company ? infoRow("Company", data.company) : "",
    infoRow("Package", data.package_name || data.project_type),
    data.budget ? infoRow("Budget", data.budget) : "",
    data.total ? infoRow("Estimated total", `&#8358;${data.total.toLocaleString()}`) : "",
    data.timeline ? infoRow("Timeline", data.timeline) : "",
  ].filter(Boolean);

  return {
    to: ADMIN_EMAIL,
    subject: `New project inquiry — ${data.name} (${data.project_type})`,
    html: baseTemplate(`
      <p style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#eab308;margin:0 0 8px;">New Submission</p>
      ${h1("New Project Inquiry")}
      ${para("A new project brief has been submitted via the OKIKE website.")}
      ${infoCard(rows)}
      ${infoCard([`<p style="font-size:13px;font-weight:700;color:#111;margin:0 0 8px;">Project details:</p><p style="font-size:13px;color:#555;margin:0;white-space:pre-wrap;line-height:1.6;">${data.details}</p>`])}
      ${ctaButton("Review in Admin", "https://okikeenterprises.com/admin/inquiries")}
    `),
  };
}

export function inquiryClientEmail(data: {
  name: string;
  project_type: string;
}): EmailPayload {
  const firstName = data.name.split(" ")[0];
  return {
    to: data.name,
    subject: `We received your project brief — OKIKE`,
    html: baseTemplate(`
      ${h1(`We've got your brief, ${firstName}.`)}
      ${para(`Thanks for submitting your <strong style="color:#111;">${data.project_type}</strong> project to OKIKE. We've received everything and a member of our team will review it within <strong style="color:#111;">24 hours</strong>.`)}
      ${infoCard([
      `<p style="font-size:13px;font-weight:700;color:#111;margin:0 0 10px;">What happens next:</p>`,
      `<p style="font-size:13px;color:#555;margin:4px 0;">1 &mdash; We review your brief and confirm feasibility</p>`,
      `<p style="font-size:13px;color:#555;margin:4px 0;">2 &mdash; We send you a written proposal or follow-up questions</p>`,
      `<p style="font-size:13px;color:#555;margin:4px 0;">3 &mdash; Once agreed, you'll receive a deposit link to get started</p>`,
    ])}
      ${para("Track your project status anytime in your dashboard.")}
      ${ctaButton("View Dashboard", "https://okikeenterprises.com/dashboard")}
      ${para(`Questions? Reply to this email or reach us at <a href="mailto:support@okikeenterprises.com" style="color:#eab308;">support@okikeenterprises.com</a>`)}
    `),
  };
}

export function contactAdminEmail(data: {
  name: string;
  email: string;
  message: string;
}): EmailPayload {
  return {
    to: ADMIN_EMAIL,
    subject: `New contact message from ${data.name}`,
    html: baseTemplate(`
      <p style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#eab308;margin:0 0 8px;">Contact Form</p>
      ${h1("New Message")}
      ${infoCard([
      infoRow("Name", data.name),
      infoRow("Email", `<a href="mailto:${data.email}" style="color:#eab308;">${data.email}</a>`),
    ])}
      ${infoCard([`<p style="font-size:13px;font-weight:700;color:#111;margin:0 0 8px;">Message:</p><p style="font-size:13px;color:#555;margin:0;white-space:pre-wrap;line-height:1.6;">${data.message}</p>`])}
      ${ctaButton(`Reply to ${data.name}`, `mailto:${data.email}?subject=Re: Your message to OKIKE`)}
    `),
  };
}

export function contactClientEmail(data: { name: string }): EmailPayload {
  const firstName = data.name.split(" ")[0];
  return {
    to: data.name,
    subject: `We got your message — OKIKE`,
    html: baseTemplate(`
      ${h1(`Message received, ${firstName}.`)}
      ${para("Thanks for reaching out to OKIKE. We typically respond within <strong style=\"color:#111;\">24 hours</strong> on business days.")}
      ${para(`If your inquiry is urgent, reach us directly at <a href="mailto:support@okikeenterprises.com" style="color:#eab308;">support@okikeenterprises.com</a>.`)}
      ${ctaButton("Back to OKIKE", "https://okikeenterprises.com")}
    `),
  };
}

export function enrollmentAdminEmail(data: {
  name: string;
  email: string;
  phone?: string;
  experience_level: string;
  goals: string;
}): EmailPayload {
  const rows = [
    infoRow("Name", data.name),
    infoRow("Email", `<a href="mailto:${data.email}" style="color:#eab308;">${data.email}</a>`),
    data.phone ? infoRow("Phone/WhatsApp", data.phone) : "",
    infoRow("Experience level", data.experience_level),
  ].filter(Boolean);

  return {
    to: ADMIN_EMAIL,
    subject: `New academy application — ${data.name} (${data.experience_level})`,
    html: baseTemplate(`
      <p style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#eab308;margin:0 0 8px;">Academy Application</p>
      ${h1("New Application")}
      ${infoCard(rows)}
      ${infoCard([`<p style="font-size:13px;font-weight:700;color:#111;margin:0 0 8px;">Why they want to join:</p><p style="font-size:13px;color:#555;margin:0;white-space:pre-wrap;line-height:1.6;">${data.goals}</p>`])}
      ${ctaButton(`Reply to Applicant`, `mailto:${data.email}?subject=Your OKIKE Academy Application`)}
    `),
  };
}

export function enrollmentClientEmail(data: { name: string }): EmailPayload {
  const firstName = data.name.split(" ")[0];
  return {
    to: data.name,
    subject: `Application received — OKIKE Academy`,
    html: baseTemplate(`
      ${h1(`Application received, ${firstName}.`)}
      ${para("Thank you for applying to the <strong style=\"color:#111;\">OKIKE Academy</strong>. We review every application personally and will be in touch within <strong style=\"color:#111;\">3&ndash;5 business days</strong>.")}
      ${infoCard([
      `<p style="font-size:13px;font-weight:700;color:#111;margin:0 0 10px;">What to expect:</p>`,
      `<p style="font-size:13px;color:#555;margin:4px 0;">1 &mdash; Personal review of your application</p>`,
      `<p style="font-size:13px;color:#555;margin:4px 0;">2 &mdash; A short call or follow-up questions if needed</p>`,
      `<p style="font-size:13px;color:#555;margin:4px 0;">3 &mdash; Acceptance decision with next steps</p>`,
    ])}
      ${para("In the meantime, explore our curriculum and what our students have built.")}
      ${ctaButton("Explore the Academy", "https://okikeenterprises.com/learn")}
    `),
  };
}
