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
      supabase.from("schemes").select("id, name, department, government_level").limit(4), // For now using a placeholder for "saved" until we have a bookmarks table
      supabase.from("audit_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    ]);

    // Calculate status breakdown
    const statusCounts = (appStatusData || []).reduce((acc: any, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {});

    // Calculate percentage change if we had history, for now just static demo values for the "trend" part but derived from real counts
    // In a real prod app, we'd query count for this month vs last month

    return {
      stats: {
        applications: appCount || 0,
        documents: docCount || 0,
        statusBreakdown: statusCounts,
        pendingReview: statusCounts['under_review'] || 0,
      },
      recentConversations: recentConv || [],
      savedSchemes: savedSchemes || [],
      activity: recentActivity || [],
      alerts: [
        { id: '1', title: 'New Scheme Alert', message: 'PM Kisan Nidhi 16th Installment released.', type: 'info' },
        { id: '2', title: 'Document Required', message: 'Please upload income certificate for Application #8821.', type: 'warning' }
      ]
    };
  });
