import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getPendingSchemes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Check if user is admin
    const { data: hasAdmin, error: roleError } = await context.supabase
      .rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    
    if (roleError) {
      console.error("Verification Role Error:", roleError);
      throw new Error(`Auth Error: ${roleError.message}`);
    }

    if (!hasAdmin) {
      throw new Error("Unauthorized: Admin role required");
    }

    const { data, error } = await supabaseAdmin
      .from("schemes")
      .select(`
        *,
        scheme_change_history (*),
        scheme_source_mapping (*)
      `)
      .in("verification_status", ["pending_verification", "draft"])
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  });

export const verifyScheme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({
    schemeId: z.string().uuid(),
    action: z.enum(["approve", "reject", "archive", "re-verify"]),
    notes: z.string().optional(),
    updates: z.record(z.any()).optional()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { schemeId, action, notes, updates } = data;

    // Check admin
    const { data: hasAdmin } = await context.supabase
      .rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    
    if (!hasAdmin) throw new Error("Unauthorized");

    const { data: current } = await supabaseAdmin
      .from("schemes")
      .select("verification_status")
      .eq("id", schemeId)
      .single();

    let newStatus = current?.verification_status;
    if (action === "approve") newStatus = "verified";
    else if (action === "reject") newStatus = "draft";
    else if (action === "archive") newStatus = "archived";
    else if (action === "re-verify") newStatus = "pending_verification";

    // Update scheme
    const { error: updateError } = await supabaseAdmin
      .from("schemes")
      .update({
        ...updates,
        verification_status: newStatus,
        last_verified_at: action === "approve" ? new Date().toISOString() : undefined
      } as any)
      .eq("id", schemeId);

    if (updateError) throw new Error(updateError.message);

    // Log action
    await supabaseAdmin.from("scheme_verification_logs").insert({
      scheme_id: schemeId,
      reviewer_id: context.userId,
      action,
      previous_status: current?.verification_status,
      new_status: newStatus,
      notes
    } as any);

    return { success: true };
  });

export const getVerificationLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ schemeId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: hasAdmin } = await context.supabase
      .rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (!hasAdmin) throw new Error("Unauthorized");

    const { data: logs, error } = await supabaseAdmin
      .from("scheme_verification_logs")
      .select(`
        *,
        profiles:reviewer_id (full_name)
      `)
      .eq("scheme_id", data.schemeId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return logs || [];
  });
