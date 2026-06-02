import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type AuthedSupabase = SupabaseClient<Database>;
type DynamicMutationBuilder = {
  upsert(row: Record<string, unknown>): Promise<{ error: { message: string } | null }>;
  delete(): {
    eq(column: string, value: string): Promise<{ error: { message: string } | null }>;
  };
};
type DynamicSupabase = {
  from(table: string): DynamicMutationBuilder;
};

async function ensureAdmin(supabase: AuthedSupabase, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin only");
}

// ---- Inquiries ----

export const setInquiryStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["new", "reviewing", "accepted", "declined"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("project_inquiries")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const convertInquiryToProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        inquiryId: z.string().uuid(),
        title: z.string().min(1).max(200),
        package_name: z.string().max(120).optional(),
        total: z.number().optional(),
        deposit: z.number().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { data: inq, error: inqErr } = await context.supabase
      .from("project_inquiries")
      .select("*")
      .eq("id", data.inquiryId)
      .single();
    if (inqErr || !inq) throw new Error("Inquiry not found");

    const { data: project, error } = await context.supabase
      .from("client_projects")
      .insert({
        client_user_id: inq.client_user_id,
        client_email: inq.email,
        inquiry_id: inq.id,
        title: data.title,
        package_name: data.package_name ?? inq.project_type,
        total: data.total ?? null,
        deposit: data.deposit ?? null,
        stage: "accepted",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    await context.supabase
      .from("project_inquiries")
      .update({ status: "accepted" })
      .eq("id", inq.id);

    return { ok: true, projectId: project.id };
  });

// ---- Projects ----

export const updateProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        stage: z
          .enum(["submitted", "reviewing", "accepted", "declined", "in_progress", "completed"])
          .optional(),
        admin_notes: z.string().max(4000).nullable().optional(),
        title: z.string().max(200).optional(),
        total: z.number().nullable().optional(),
        deposit: z.number().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("client_projects").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "active", "done"]).optional(),
        note: z.string().max(2000).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("project_milestones").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const postProjectUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ project_id: z.string().uuid(), message: z.string().min(1).max(4000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("project_updates").insert({
      project_id: data.project_id,
      message: data.message,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Generic CMS upsert/delete ----

const ALLOWED_TABLES = [
  "services",
  "packages",
  "addons",
  "portfolio_items",
  "partners",
  "team_members",
  "site_settings",
  "blog_posts",
  "courses",
  "tracks",
  "physical_classes",
] as const;

type CmsTable = (typeof ALLOWED_TABLES)[number];

export const cmsUpsert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        table: z.enum(ALLOWED_TABLES),
        row: z.record(z.string(), z.unknown()),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const tableClient = context.supabase as unknown as DynamicSupabase;
    const { error } = await tableClient.from(data.table).upsert(data.row);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cmsDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ table: z.enum(ALLOWED_TABLES), id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const col = data.table === "site_settings" ? "key" : "id";
    const tableClient = context.supabase as unknown as DynamicSupabase;
    const { error } = await tableClient
      .from(data.table as CmsTable)
      .delete()
      .eq(col, data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ userId: z.string(), role: z.enum(["admin", "client"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { error: deleteError } = await context.supabase
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId);
    if (deleteError) throw new Error(deleteError.message);
    const { error: insertError } = await context.supabase
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (insertError) throw new Error(insertError.message);
    return { ok: true };
  });

export const updateUserProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        profileId: z.string(),
        updates: z.object({
          full_name: z.string().optional(),
          email: z.string().optional(),
        }),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("profiles")
      .update(data.updates)
      .eq("id", data.profileId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
