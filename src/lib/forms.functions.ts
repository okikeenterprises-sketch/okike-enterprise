import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const inquirySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional().or(z.literal("")),
  company: z.string().max(120).optional().or(z.literal("")),
  project_type: z.string().min(1).max(80),
  budget: z.string().max(80).optional().or(z.literal("")),
  timeline: z.string().max(80).optional().or(z.literal("")),
  details: z.string().min(10).max(4000),
  client_user_id: z.string().uuid(),
  package_name: z.string().optional().or(z.literal("")),
  total: z.number().optional().nullable(),
  deposit: z.number().optional().nullable(),
  currency: z.string().optional().or(z.literal("")),
});

export const submitInquiry = createServerFn({ method: "POST" })
  .inputValidator((data) => inquirySchema.parse(data))
  .handler(async ({ data }) => {
    console.log("submitInquiry called with data:", { ...data, details: "[REDACTED]" });

    // Step 1: Insert project inquiry
    const { data: inquiry, error: inquiryError } = await supabaseAdmin
      .from("project_inquiries")
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        company: data.company || null,
        project_type: data.project_type,
        budget: data.budget || null,
        timeline: data.timeline || null,
        details: data.details,
        client_user_id: data.client_user_id,
      })
      .select("id")
      .single();

    if (inquiryError) {
      console.error("submitInquiry error (project_inquiries):", inquiryError);
      return { ok: false as const, error: inquiryError.message };
    }

    console.log("Created project inquiry with id:", inquiry.id);

    // Step 2: Insert client project
    const { data: project, error: projectError } = await supabaseAdmin
      .from("client_projects")
      .insert({
        client_user_id: data.client_user_id,
        client_email: data.email,
        inquiry_id: inquiry.id,
        title: data.package_name || "Custom Project",
        package_name: data.package_name || null,
        total: data.total || null,
        deposit: data.deposit || null,
        currency: data.currency || "NGN",
        stage: "submitted",
      })
      .select("*")
      .single();

    if (projectError) {
      console.error("submitInquiry error (client_projects):", projectError);
      return { ok: false as const, error: projectError.message };
    }

    console.log("Created client project:", project);

    return { ok: true as const };
  });

const enrollSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional().or(z.literal("")),
  experience_level: z.string().min(1).max(40),
  goals: z.string().min(10).max(2000),
});

export const submitEnrollment = createServerFn({ method: "POST" })
  .inputValidator((data) => enrollSchema.parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("course_enrollments").insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      experience_level: data.experience_level,
      goals: data.goals,
    });
    if (error) {
      console.error("submitEnrollment error:", error);
      return { ok: false as const, error: "Could not submit. Please try again." };
    }
    return { ok: true as const };
  });

const contactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  message: z.string().min(5).max(4000),
});

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((data) => contactSchema.parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      message: data.message,
    });
    if (error) {
      console.error("submitContact error:", error);
      return { ok: false as const, error: "Could not submit. Please try again." };
    }
    return { ok: true as const };
  });
