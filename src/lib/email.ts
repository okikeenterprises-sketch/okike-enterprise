const RESEND_API_URL = "https://api.resend.com/emails";
const FROM = "OKIKE <noreply@okikeenterprises.com>";
const ADMIN_EMAIL = "okikeenterprises@gmail.com"; // change to your preferred admin inbox

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

// ─── Base template — dark site theme ─────────────────────────────────────────

function baseTemplate(content: string): string {
  const year = new Date().getFullYear();
  return [
    "<!DOCTYPE html><html><head>",
    "<meta charset='utf-8'/>",
    "<meta name='viewport' content='width=device-width,initial-scale=1'/>",
    "<style>",
    "body{margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5;}",
    ".w{max-width:600px;margin:0 auto;padding:40px 24px;}",
    ".logo{font-size:24px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;color:#fff;}",
    ".logo b{color:#eab308;}",
    ".sub{font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#444;margin-top:4px;}",
    "hr{border:none;border-top:1px solid #1c1c1c;margin:28px 0;}",
    ".bar{width:32px;height:3px;background:#eab308;margin-bottom:14px;}",
    ".label{font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#555;margin-bottom:6px;}",
    "h1{font-size:30px;font-weight:800;color:#fff;margin:0 0 14px;line-height:1.1;letter-spacing:-0.02em;}",
    "h1 span{color:#eab308;}",
    "p{font-size:14px;line-height:1.7;color:#888;margin:0 0 14px;}",
    "strong{color:#fff;}",
    "a.yellow{color:#eab308;text-decoration:none;}",
    ".card{background:#111;border:1px solid #1c1c1c;border-left:3px solid #eab308;padding:18px 22px;margin:18px 0;}",
    ".card p{color:#bbb;margin:5px 0;font-size:13px;}",
    ".card strong{color:#fff;}",
    ".pre{color:#999;white-space:pre-wrap;font-size:13px;line-height:1.6;}",
    ".btn{display:inline-block;background:#eab308;color:#000 !important;font-weight:800;font-size:11px;padding:14px 32px;text-decoration:none;letter-spacing:0.18em;text-transform:uppercase;margin:18px 0 6px;}",
    ".footer{font-size:11px;color:#333;text-align:center;margin-top:48px;padding-top:22px;border-top:1px solid #161616;}",
    ".footer a{color:#eab308;text-decoration:none;}",
    "</style></head>",
    "<body><div class='w'>",
    "<div class='logo'>OKI<b>KE</b></div>",
    "<div class='sub'>Your Digital Ecosystem</div>",
    "<hr/>",
    content,
    "<div class='footer'>",
    `<p>&copy; ${year} OKIKE Enterprises &nbsp;&middot;&nbsp; <a href='https://okikeenterprises.com'>okikeenterprises.com</a></p>`,
    "<p style='margin-top:6px'>You're receiving this because you interacted with OKIKE.</p>",
    "</div></div></body></html>",
  ].join("\n");
}

// ─── Email templates ──────────────────────────────────────────────────────────

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
  return {
    to: ADMIN_EMAIL,
    subject: `New project inquiry — ${data.name} (${data.project_type})`,
    html: baseTemplate([
      "<div class='bar'></div>",
      "<div class='label'>New Submission</div>",
      "<h1>New Project <span>Inquiry</span></h1>",
      "<p>A new project brief has been submitted via the OKIKE website.</p>",
      "<div class='card'>",
      `<p><strong>Name:</strong> ${data.name}</p>`,
      `<p><strong>Email:</strong> <a class='yellow' href='mailto:${data.email}'>${data.email}</a></p>`,
      data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : "",
      data.company ? `<p><strong>Company:</strong> ${data.company}</p>` : "",
      `<p><strong>Package:</strong> ${data.package_name || data.project_type}</p>`,
      data.budget ? `<p><strong>Budget:</strong> ${data.budget}</p>` : "",
      data.total ? `<p><strong>Estimated total:</strong> &#8358;${data.total.toLocaleString()}</p>` : "",
      data.timeline ? `<p><strong>Timeline:</strong> ${data.timeline}</p>` : "",
      "</div>",
      "<div class='card'>",
      "<p><strong>Project details:</strong></p>",
      `<p class='pre'>${data.details}</p>`,
      "</div>",
      `<a class='btn' href='https://okikeenterprises.com/admin/inquiries'>Review in Admin &rarr;</a>`,
    ].join("\n")),
  };
}

export function inquiryClientEmail(data: {
  name: string;
  project_type: string;
}): EmailPayload {
  return {
    to: data.name,
    subject: `We received your project brief — OKIKE`,
    html: baseTemplate([
      "<div class='bar'></div>",
      `<h1>We've got your brief, <span>${data.name.split(" ")[0]}.</span></h1>`,
      `<p>Thanks for submitting your <strong>${data.project_type}</strong> project to OKIKE. We've received everything and a member of our team will review it within <strong>24 hours</strong>.</p>`,
      "<div class='card'>",
      "<p><strong>What happens next:</strong></p>",
      "<p>1 &mdash; We review your brief and confirm feasibility</p>",
      "<p>2 &mdash; We send you a written proposal or follow-up questions</p>",
      "<p>3 &mdash; Once agreed, you'll receive a deposit link to get started</p>",
      "</div>",
      "<p>Track your project status anytime in your dashboard.</p>",
      `<a class='btn' href='https://okikeenterprises.com/dashboard'>View Dashboard &rarr;</a>`,
      `<p style='margin-top:20px'>Questions? Reply to this email or reach us at <a class='yellow' href='mailto:support@okikeenterprises.com'>support@okikeenterprises.com</a></p>`,
    ].join("\n")),
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
    html: baseTemplate([
      "<div class='bar'></div>",
      "<div class='label'>Contact Form</div>",
      "<h1>New <span>Message</span></h1>",
      "<div class='card'>",
      `<p><strong>Name:</strong> ${data.name}</p>`,
      `<p><strong>Email:</strong> <a class='yellow' href='mailto:${data.email}'>${data.email}</a></p>`,
      "</div>",
      "<div class='card'>",
      "<p><strong>Message:</strong></p>",
      `<p class='pre'>${data.message}</p>`,
      "</div>",
      `<a class='btn' href='mailto:${data.email}?subject=Re: Your message to OKIKE'>Reply to ${data.name} &rarr;</a>`,
    ].join("\n")),
  };
}

export function contactClientEmail(data: { name: string }): EmailPayload {
  return {
    to: data.name,
    subject: `We got your message — OKIKE`,
    html: baseTemplate([
      "<div class='bar'></div>",
      `<h1>Message received, <span>${data.name.split(" ")[0]}.</span></h1>`,
      "<p>Thanks for reaching out to OKIKE. We typically respond within <strong>24 hours</strong> on business days.</p>",
      `<p>If your inquiry is urgent, reach us directly at <a class='yellow' href='mailto:support@okikeenterprises.com'>support@okikeenterprises.com</a>.</p>`,
      `<a class='btn' href='https://okikeenterprises.com'>Back to OKIKE &rarr;</a>`,
    ].join("\n")),
  };
}

export function enrollmentAdminEmail(data: {
  name: string;
  email: string;
  phone?: string;
  experience_level: string;
  goals: string;
}): EmailPayload {
  return {
    to: ADMIN_EMAIL,
    subject: `New academy application — ${data.name} (${data.experience_level})`,
    html: baseTemplate([
      "<div class='bar'></div>",
      "<div class='label'>Academy Application</div>",
      "<h1>New <span>Application</span></h1>",
      "<div class='card'>",
      `<p><strong>Name:</strong> ${data.name}</p>`,
      `<p><strong>Email:</strong> <a class='yellow' href='mailto:${data.email}'>${data.email}</a></p>`,
      data.phone ? `<p><strong>Phone/WhatsApp:</strong> ${data.phone}</p>` : "",
      `<p><strong>Experience level:</strong> ${data.experience_level}</p>`,
      "</div>",
      "<div class='card'>",
      "<p><strong>Why they want to join:</strong></p>",
      `<p class='pre'>${data.goals}</p>`,
      "</div>",
      `<a class='btn' href='mailto:${data.email}?subject=Your OKIKE Academy Application'>Reply to Applicant &rarr;</a>`,
    ].join("\n")),
  };
}

export function enrollmentClientEmail(data: { name: string }): EmailPayload {
  return {
    to: data.name,
    subject: `Application received — OKIKE Academy`,
    html: baseTemplate([
      "<div class='bar'></div>",
      `<h1>Application received, <span>${data.name.split(" ")[0]}.</span></h1>`,
      "<p>Thank you for applying to the <strong>OKIKE Academy</strong>. We review every application personally and will be in touch within <strong>3&ndash;5 business days</strong>.</p>",
      "<div class='card'>",
      "<p><strong>What to expect:</strong></p>",
      "<p>1 &mdash; Personal review of your application</p>",
      "<p>2 &mdash; A short call or follow-up questions if needed</p>",
      "<p>3 &mdash; Acceptance decision with next steps</p>",
      "</div>",
      "<p>In the meantime, explore our curriculum and what our students have built.</p>",
      `<a class='btn' href='https://okikeenterprises.com/learn'>Explore the Academy &rarr;</a>`,
    ].join("\n")),
  };
}
