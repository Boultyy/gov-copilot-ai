import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const applicationSchema = z.object({
  scheme_id: z.string().uuid().optional().nullable(),
  service_id: z.string().uuid().optional().nullable(),
  external_app_id: z.string().min(1),
  status: z.enum(['draft', 'submitted', 'under_review', 'documents_required', 'approved', 'rejected', 'completed', 'cancelled']),
  department: z.string().min(1),
  notes: z.string().optional(),
  source_reference: z.string().optional(),
  application_date: z.string().optional(),
});

export const getApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("applications")
      .select(`
        *,
        scheme:schemes(name, department),
        service:services(name, department),
        events:application_events(*)
      `)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) throw new Error("Failed to fetch applications");
    return data;
  });

export const createApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: z.infer<typeof applicationSchema>) => applicationSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: app, error } = await supabase
      .from("applications")
      .insert({
        ...data,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw new Error("Failed to create application");
    return app;
  });

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string; status: string; notes?: string }) =>
    z.object({ 
      id: z.string().uuid(), 
      status: z.enum(['draft', 'submitted', 'under_review', 'documents_required', 'approved', 'rejected', 'completed', 'cancelled']),
      notes: z.string().optional()
    }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: app, error } = await supabase
      .from("applications")
      .update({ 
        status: data.status,
        notes: data.notes,
        updated_at: new Date().toISOString()
      })
      .eq("id", data.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw new Error("Failed to update status");
    return app;
  });

export const deleteApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);

    if (error) throw new Error("Failed to delete application");
    return { success: true };
  });
