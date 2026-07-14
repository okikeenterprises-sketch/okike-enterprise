import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

export const Route = createFileRoute("/api/receipt/$id")({
  server: {
    handlers: {
      GET: async ({ params }: { params: { id: string } }) => {
        const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

        if (!supabaseUrl || !serviceRoleKey) {
          return new Response("Server Configuration Error", { status: 500 });
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey);
        const { data: reg, error } = await supabase
          .from("bootcamp_registrations")
          .select("*")
          .eq("id", params.id)
          .single();

        if (error || !reg) {
          return new Response("Ticket/Receipt not found", { status: 404 });
        }

        // Read OKIKE logo from disk and base64-encode it
        const logoPath = path.join(process.cwd(), "src/assets/okike-logo.png");
        let base64Logo = "";
        try {
          if (fs.existsSync(logoPath)) {
            const fileBuffer = fs.readFileSync(logoPath);
            base64Logo = `data:image/png;base64,${fileBuffer.toString("base64")}`;
          }
        } catch (err) {
          console.error("Could not read logo image file:", err);
        }

        // Render beautiful printable HTML receipt (Yellow & Black Brand Colors)
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>OKIKE Receipt - ${reg.name}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #fff; margin: 40px; background: #000000; }
        .receipt-card { max-width: 600px; margin: 0 auto; border: 2px solid #eab308; border-radius: 16px; padding: 40px; box-shadow: 0 10px 30px rgba(234,179,8,0.15); background: #0a0a0a; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed #eab308; padding-bottom: 24px; margin-bottom: 32px; }
        .logo-img { height: 36px; width: auto; object-fit: contain; }
        .logo { font-size: 26px; font-weight: 800; color: #eab308; letter-spacing: -1.5px; }
        .title { font-size: 16px; font-weight: 700; text-transform: uppercase; color: #eab308; letter-spacing: 1px; }
        .details-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 24px; margin-bottom: 40px; }
        .details-grid div { display: flex; flex-direction: column; }
        .label { font-size: 10px; text-transform: uppercase; color: #eab308; opacity: 0.8; margin-bottom: 6px; font-weight: 700; letter-spacing: 0.5px; }
        .val { font-size: 14px; font-weight: 600; color: #ffffff; }
        .amount-section { background: #111111; border: 1px solid #eab308; border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
        .amount { font-size: 24px; font-weight: 800; color: #eab308; }
        .footer { text-align: center; font-size: 12px; color: #a1a1aa; border-top: 1px solid #1f1f22; padding-top: 24px; line-height: 1.6; }
        .actions-bar { max-width: 600px; margin: 30px auto 0; display: flex; flex-direction: column; align-items: center; gap: 15px; }
        .btn-print { padding: 12px 28px; background: #eab308; color: black; border: none; border-radius: 10px; font-weight: bold; text-decoration: none; cursor: pointer; font-size: 14px; box-shadow: 0 4px 12px rgba(234,179,8,0.3); transition: background-color 0.2s; text-transform: uppercase; letter-spacing: 0.5px; }
        .btn-print:hover { background: #ca8a04; }
        
        .email-form { width: 100%; display: flex; justify-content: center; gap: 10px; margin-top: 10px; }
        .email-input { padding: 12px; border-radius: 8px; border: 1px solid #3f3f46; background: #0f172a; color: white; width: 250px; font-size: 13px; focus: outline-none; focus: border-width: 2px; }
        .email-btn { padding: 12px 20px; background: #1f2937; color: #eab308; border: 1px solid #eab308; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 13px; transition: all 0.2s; }
        .email-btn:hover { background: #eab308; color: black; }
        
        @media print {
            .actions-bar { display: none; }
            body { margin: 0; background: none; }
            .receipt-card { border: none; box-shadow: none; padding: 0; }
        }
    </style>
</head>
<body>
    <div class="receipt-card">
        <div class="header">
            ${base64Logo ? `<img src="${base64Logo}" alt="OKIKE" class="logo-img" />` : `<div class="logo">OKIKE</div>`}
            <div class="title">Bootcamp Ticket</div>
        </div>
        <div class="details-grid">
            <div>
                <span class="label">Attendee Name</span>
                <span class="val">${reg.name}</span>
            </div>
            <div>
                <span class="label">Email Address</span>
                <span class="val">${reg.email}</span>
            </div>
            <div>
                <span class="label">Course Track</span>
                <span class="val">${reg.course || "General Track"}</span>
            </div>
            <div>
                <span class="label">Department / School</span>
                <span class="val">${reg.department} (${reg.level})</span>
            </div>
            <div>
                <span class="label">Reference Code</span>
                <span class="val font-mono" style="font-family: monospace; color: #eab308;">${reg.payment_reference || "N/A (Free Track)"}</span>
            </div>
            <div>
                <span class="label">Date Registered</span>
                <span class="val">${new Date(reg.created_at).toLocaleDateString()}</span>
            </div>
        </div>
        <div class="amount-section">
            <div>
                <span class="label">Payment Status</span>
                <span class="val" style="color: ${reg.payment_status === "paid" || reg.payment_status === "free" ? "#10b981" : "#f59e0b"}; font-weight: bold; text-transform: uppercase;">
                    Confirmed (${reg.payment_status === "paid" ? "PAID" : "FREE ADMISSION"})
                </span>
            </div>
            <div class="amount">
                ${reg.payment_status === "paid" ? "₦5,000.00" : "₦0.00"}
            </div>
        </div>
        <div class="footer">
            Thank you for enrolling in OKIKE Computing Synergy Summit Bootcamp.<br>
            Please present a printed or digital copy of this ticket at check-in.<br>
            For support, contact support@okikeenterprises.com
        </div>
    </div>
    
    <div class="actions-bar">
        <button onclick="window.print()" class="btn-print">Print Ticket / Receipt</button>
        
        <form id="email-form" class="email-form">
            <input type="email" id="email-input" class="email-input" value="${reg.email}" placeholder="your-email@address.com" required />
            <button type="submit" class="email-btn">Email Ticket</button>
        </form>
    </div>

    <script>
        document.getElementById("email-form").addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("email-input").value;
            const btn = e.target.querySelector("button");
            const originalText = btn.innerText;
            btn.innerText = "Sending...";
            btn.disabled = true;
            try {
                const res = await fetch("/api/receipt/${reg.id}", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email })
                });
                const json = await res.json();
                if (res.ok && json.ok) {
                    alert("Ticket successfully emailed to " + email + "!");
                } else {
                    alert("Failed to send email: " + (json.error || "Please try again."));
                }
            } catch (err) {
                alert("An error occurred while emailing the receipt.");
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    </script>
</body>
</html>
`;
        return new Response(html, {
          headers: { "Content-Type": "text/html" },
        });
      },
      POST: async ({ params, request }: { params: { id: string }; request: Request }) => {
        try {
          const body = (await request.json()) as { email: string };
          if (!body.email) {
            return new Response(JSON.stringify({ ok: false, error: "Email is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
          const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

          if (!supabaseUrl || !serviceRoleKey) {
            return new Response(JSON.stringify({ ok: false, error: "Server Configuration Error" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          const supabase = createClient(supabaseUrl, serviceRoleKey);
          const { data: reg, error } = await supabase
            .from("bootcamp_registrations")
            .select("*")
            .eq("id", params.id)
            .single();

          if (error || !reg) {
            return new Response(JSON.stringify({ ok: false, error: "Ticket not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          const { sendEmail } = await import("@/lib/email");

          const appHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Summit Admission Confirmed</title></head>
<body style="margin:0;padding:0;background:#111;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#111">
<tr><td align="center" style="padding:40px 16px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#0a0a0a;border-top:4px solid #eab308;">
<tr><td align="center" style="padding:32px 40px 20px;"><a href="https://okikeenterprises.com"><img src="https://res.cloudinary.com/djzsrfc6h/image/upload/v1781531660/Asset_40_q7oeri.png" alt="OKIKE" width="120" style="display:block;border:0;"/></a></td></tr>
<tr><td style="padding:0 40px;"><div style="height:2px;background:#eab308;"></div></td></tr>
<tr><td style="padding:36px 40px 24px;text-align:center;">
<p style="font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#eab308;margin:0 0 10px;">Summit Ticket</p>
<h1 style="font-size:32px;font-weight:900;color:#fff;margin:0 0 14px;line-height:1.1;">Your Summit Ticket is here, <span style="color:#eab308;">${(reg as any).name.split(" ")[0]}!</span></h1>
<p style="font-size:15px;color:#888;margin:0 0 0;line-height:1.7;">Please find your printable check-in ticket details below.</p>
</td></tr>
<tr><td style="padding:8px 40px 32px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#111;border-left:4px solid #eab308;">
<tr><td style="padding:18px 22px;">
<p style="font-size:13px;font-weight:700;color:#fff;margin:0 0 12px;">Your Summit Ticket:</p>
<p style="font-size:13px;color:#bbb;margin:4px 0;"><strong style="color:#fff;">Name:</strong> ${(reg as any).name}</p>
<p style="font-size:13px;color:#bbb;margin:4px 0;"><strong style="color:#fff;">Course Track:</strong> ${(reg as any).course || "General Track"}</p>
<p style="font-size:13px;color:#bbb;margin:4px 0;"><strong style="color:#fff;">Registration No:</strong> ${(reg as any).reg_no || "N/A"}</p>
<p style="font-size:13px;color:#bbb;margin:4px 0;"><a href="https://okike.ai/api/receipt/${(reg as any).id}" style="color:#eab308;text-decoration:underline;">Click here to view/print your ticket/receipt</a></p>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:8px 40px 36px;text-align:center;">
<p style="font-size:13px;color:#555;margin:0;">Questions? <a href="mailto:support@okikeenterprises.com" style="color:#eab308;text-decoration:none;">support@okikeenterprises.com</a></p>
</td></tr>
<tr><td style="padding:16px 40px 28px;border-top:1px solid #1a1a1a;text-align:center;">
<p style="font-size:12px;color:#444;margin:0;">&copy; ${new Date().getFullYear()} OKIKE Enterprises &nbsp;&middot;&nbsp; <a href="https://okikeenterprises.com" style="color:#eab308;text-decoration:none;">okikeenterprises.com</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

          await sendEmail({
            to: body.email,
            subject: "Your OKIKE Summit Ticket / Receipt",
            html: appHtml,
          });

          return new Response(JSON.stringify({ ok: true }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ ok: false, error: err.message || "Failed to send email" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
