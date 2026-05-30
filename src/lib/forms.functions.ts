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
  client_user_id: z.string().uuid().optional().or(z.literal("")),
});

export const submitInquiry = createServerFn({ method: "POST" })
  .inputValidator((data) => inquirySchema.parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("project_inquiries").insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      company: data.company || null,
      project_type: data.project_type,
      budget: data.budget || null,
      timeline: data.timeline || null,
      details: data.details,
      client_user_id: data.client_user_id || null,
    });
    if (error) {
      console.error("submitInquiry error:", error);
      return { ok: false as const, error: "Could not submit. Please try again." };
    }
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
