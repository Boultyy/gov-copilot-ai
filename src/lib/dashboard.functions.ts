import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Parallel counts and stats using SQL queries
    const [
      { count: appCount },
      { count: docCount },
      { data: appStatusData },
      { data: recentConv },
      { data: savedSchemes },
      { data: recentActivity },
    ] = await Promise.all([
      supabase.from("applications").select("*", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("documents").select("*", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("applications").select("status").eq("user_id", userId),
      supabase.from("conversations").select("id, title, updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(3),
      supabase.from("schemes").select("id, name, department, government_level").limit(4), // Bookmarks placeholder
      supabase.from("audit_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    ]);

    // Calculate status breakdown
    const statusCounts: Record<string, number> = (appStatusData || []).reduce((acc: Record<string, number>, curr: any) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {});

    return {
      stats: {
        applications: appCount || 0,
        documents: docCount || 0,
        statusBreakdown: statusCounts,
        pendingReview: statusCounts['under_review'] || 0,
      },
      recentConversations: (recentConv || []).map((c: any) => ({
        id: c.id as string,
        title: c.title as string,
        updated_at: c.updated_at as string
      })),
      savedSchemes: (savedSchemes || []).map((s: any) => ({
        id: s.id as string,
        name: s.name as string,
        department: s.department as string,
        government_level: s.government_level as string
      })),
      activity: (recentActivity || []).map((a: any) => ({
        id: a.id as string,
        action: a.action as string,
        created_at: a.created_at as string,
        entity_type: a.entity_type as string
      })),
      alerts: [
        { id: '1', title: 'New Scheme Alert', message: 'PM Kisan Nidhi 16th Installment released.', type: 'info' },
        { id: '2', title: 'Document Required', message: 'Please upload income certificate for Application #8821.', type: 'warning' }
      ]
    };
  });
