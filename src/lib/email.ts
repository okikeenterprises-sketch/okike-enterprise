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

// ─── Email templates ──────────────────────────────────────────────────────────

function baseTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 0; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e5e5e5; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 24px; }
    .logo { font-size: 22px; font-weight: 800; letter-spacing: 0.1em; color: #fff; text-decoration: none; }
    .logo span { color: #facc15; }
    .divider { border: none; border-top: 1px solid #222; margin: 24px 0; }
    h1 { font-size: 28px; font-weight: 700; color: #fff; margin: 0 0 12px; }
    p { font-size: 15px; line-height: 1.6; color: #aaa; margin: 0 0 16px; }
    .highlight { color: #facc15; }
    .card { background: #111; border: 1px solid #222; border-radius: 8px; padding: 20px 24px; margin: 20px 0; }
    .card p { color: #ccc; margin: 4px 0; }
    .card strong { color: #fff; }
    .btn { display: inline-block; background: #facc15; color: #000; font-weight: 700; font-size: 14px; padding: 12px 28px; text-decoration: none; border-radius: 4px; margin: 16px 0; letter-spacing: 0.05em; text-transform: uppercase; }
    .footer { font-size: 12px; color: #555; text-align: center; margin-top: 40px; }
    .footer a { color: #facc15; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <a class="logo" href="https://okikeenterprises.com">OKI<span>KE</span></a>
    <hr class="divider" />
    ${content}
    <div class="footer">
      <p>© ${new Date().getFullYear()} OKIKE Enterprises &nbsp;·&nbsp; <a href="https://okikeenterprises.com">okikeenterprises.com</a></p>
    </div>
  </div>
</body>
</html>`;
}

// Project inquiry — to admin
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
        html: baseTemplate(`
      <h1>New Project Inquiry</h1>
      <p>A new project brief has been submitted via the OKIKE website.</p>
      <div class="card">
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ""}
        ${data.company ? `<p><strong>Company:</strong> ${data.company}</p>` : ""}
        <p><strong>Package:</strong> ${data.package_name || data.project_type}</p>
        ${data.budget ? `<p><strong>Budget:</strong> ${data.budget}</p>` : ""}
        ${data.total ? `<p><strong>Estimated total:</strong> ₦${data.total.toLocaleString()}</p>` : ""}
        ${data.timeline ? `<p><strong>Timeline:</strong> ${data.timeline}</p>` : ""}
      </div>
      <div class="card">
        <p><strong>Project details:</strong></p>
        <p style="white-space: pre-wrap;">${data.details}</p>
      </div>
      <a class="btn" href="https://okikeenterprises.com/admin/inquiries">Review in Admin →</a>
    `),
    };
}

// Project inquiry — to client
export function inquiryClientEmail(data: {
    name: string;
    project_type: string;
}): EmailPayload {
    return {
        to: data.name,
        subject: `We received your project brief — OKIKE`,
        html: baseTemplate(`
      <h1>We've got your brief, ${data.name.split(" ")[0]}.</h1>
      <p>Thanks for submitting your <span class="highlight">${data.project_type}</span> project to OKIKE. We've received everything and a member of our team will review it within <strong style="color:#fff">24 hours</strong>.</p>
      <div class="card">
        <p><strong>What happens next:</strong></p>
        <p>1. We review your brief and confirm feasibility</p>
        <p>2. We send you a written proposal or follow-up questions</p>
        <p>3. Once agreed, you'll receive a deposit link to get started</p>
      </div>
      <p>In the meantime, you can track your project status in your dashboard.</p>
      <a class="btn" href="https://okikeenterprises.com/dashboard">View Dashboard →</a>
      <p style="margin-top:24px">Questions? Reply to this email or reach us at <a href="mailto:support@okikeenterprises.com" style="color:#facc15">support@okikeenterprises.com</a></p>
    `),
    };
}

// Contact form — to admin
export function contactAdminEmail(data: {
    name: string;
    email: string;
    message: string;
}): EmailPayload {
    return {
        to: ADMIN_EMAIL,
        subject: `New contact message from ${data.name}`,
        html: baseTemplate(`
      <h1>New Contact Message</h1>
      <div class="card">
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> <a href="mailto:${data.email}" style="color:#facc15">${data.email}</a></p>
      </div>
      <div class="card">
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${data.message}</p>
      </div>
      <a class="btn" href="mailto:${data.email}?subject=Re: Your message to OKIKE">Reply to ${data.name} →</a>
    `),
    };
}

// Contact form — to sender
export function contactClientEmail(data: { name: string }): EmailPayload {
    return {
        to: data.name,
        subject: `We got your message — OKIKE`,
        html: baseTemplate(`
      <h1>Message received, ${data.name.split(" ")[0]}.</h1>
      <p>Thanks for reaching out to OKIKE. We typically respond within <strong style="color:#fff">24 hours</strong> on business days.</p>
      <p>If your inquiry is urgent, you can also reach us directly at <a href="mailto:support@okikeenterprises.com" style="color:#facc15">support@okikeenterprises.com</a>.</p>
      <a class="btn" href="https://okikeenterprises.com">Back to OKIKE →</a>
    `),
    };
}

// Enrollment — to admin
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
        html: baseTemplate(`
      <h1>New Academy Application</h1>
      <div class="card">
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> <a href="mailto:${data.email}" style="color:#facc15">${data.email}</a></p>
        ${data.phone ? `<p><strong>Phone/WhatsApp:</strong> ${data.phone}</p>` : ""}
        <p><strong>Experience level:</strong> ${data.experience_level}</p>
      </div>
      <div class="card">
        <p><strong>Why they want to join:</strong></p>
        <p style="white-space: pre-wrap;">${data.goals}</p>
      </div>
      <a class="btn" href="mailto:${data.email}?subject=Your OKIKE Academy Application">Reply to Applicant →</a>
    `),
    };
}

// Enrollment — to applicant
export function enrollmentClientEmail(data: { name: string }): EmailPayload {
    return {
        to: data.name,
        subject: `Application received — OKIKE Academy`,
        html: baseTemplate(`
      <h1>Application received, ${data.name.split(" ")[0]}.</h1>
      <p>Thank you for applying to the <span class="highlight">OKIKE Academy</span>. We review every application personally and will be in touch within <strong style="color:#fff">3–5 business days</strong>.</p>
      <div class="card">
        <p><strong>What to expect:</strong></p>
        <p>1. Personal review of your application</p>
        <p>2. A short call or follow-up questions if needed</p>
        <p>3. Acceptance decision with next steps</p>
      </div>
      <p>In the meantime, explore our curriculum and what other students have built.</p>
      <a class="btn" href="https://okikeenterprises.com/learn">Explore the Academy →</a>
    `),
    };
}
