import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export { startNewConversation, getConversations, getConversationMessages } from "./copilot.functions.original";

export const sendCopilotMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { conversationId?: string; content: string }) =>
    z.object({
      conversationId: z.string().uuid().optional(),
      content: z.string().min(1)
    }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { content } = data;
    let currentConversationId = data.conversationId;
    const startTime = Date.now();

    const log = (stage: string, extra = {}) => {
      const elapsed = Date.now() - startTime;
      console.log(`[COPILOT_DIAGNOSTIC][${elapsed}ms] ${stage}`, JSON.stringify(extra));
    };

    const getContextSchemeId = async (convId: string) => {
      const { data: lastMsgs } = await supabase
        .from("messages")
        .select("metadata")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: false })
        .limit(5);

      for (const m of lastMsgs || []) {
        const metadata = m.metadata as any;
        if (metadata?.canonical_scheme_id) {
          return metadata.canonical_scheme_id;
        }
      }
      return null;
    };

    try {
      log("COPILOT_START", { conversationId: currentConversationId, contentLen: content.length });

      // 0. Auto-create conversation if missing
      if (!currentConversationId) {
        const { data: newConv, error: convError } = await supabase
          .from("conversations")
          .insert({ user_id: userId, title: content.slice(0, 50), type: "copilot" })
          .select()
          .single();

        if (convError || !newConv) {
          log("COPILOT_FATAL_ERROR", { error: "Failed to auto-create conversation", details: convError });
          throw new Error("Failed to create conversation session");
        }
        currentConversationId = newConv.id;
        log("AUTO_CREATE_CONVERSATION_SUCCESS", { id: currentConversationId });
      }

      // 1. Save user message
      log("PERSISTING_USER_MESSAGE");
      const { data: userMsg, error: userMsgError } = await supabase
        .from("messages")
        .insert({ conversation_id: currentConversationId, role: "user", content })
        .select()
        .single();
        
      if (userMsgError) {
        log("COPILOT_FATAL_ERROR", { error: "Failed to save user message", details: userMsgError });
        throw new Error("Failed to save user message");
      }
      log("USER_MESSAGE_PERSISTED", { id: userMsg.id });

      // 2. Resolve canonical scheme (inherited context first, then strict retrieval)
      log("SCHEME_SEARCH_START");
      const { searchSchemes } = await import("./schemes.server");
      const { detectIntent, buildSchemeContext, renderFallbackAnswer, renderAiContext, renderNoMatchAnswer } =
        await import("./scheme-enrichment.server");

      const intent = detectIntent(content);
      log("INTENT_DETECTED", { intent });

      let schemes: any[] = [];
      const looksLikeNewSchemeQuery = /\b(scheme|yojana|pm[- ]|pradhan mantri|about|list|available|benefit|apply|eligib)\b/i.test(content);
      const inheritedSchemeId = await getContextSchemeId(currentConversationId);

      if (inheritedSchemeId) {
        const { data: inherited } = await supabase
          .from("schemes")
          .select("*")
          .eq("id", inheritedSchemeId)
          .maybeSingle();

        if (inherited) {
          // A follow-up keeps the canonical scheme unless the user clearly names a new one.
          let overridden = false;
          if (looksLikeNewSchemeQuery) {
            try {
              const fresh = (await Promise.race([
                searchSchemes(content),
                new Promise((_, r) => setTimeout(() => r(new Error("SCHEME_SEARCH_TIMEOUT")), 5000)),
              ])) as any[];
              if (fresh?.length && fresh[0].id !== inherited.id) {
                schemes = fresh;
                overridden = true;
                log("SCHEME_CONTEXT_SWITCHED", { from: inherited.name, to: fresh[0].name });
              }
            } catch (e: any) {
              log("SCHEME_SEARCH_FAILED", { error: e.message });
            }
          }
          if (!overridden) {
            schemes = [inherited];
            log("INHERITED_SCHEME_USED", { id: inherited.id, name: inherited.name });
          }
        }
      }

      if (schemes.length === 0) {
        try {
          schemes = (await Promise.race([
            searchSchemes(content),
            new Promise((_, r) => setTimeout(() => r(new Error("SCHEME_SEARCH_TIMEOUT")), 5000)),
          ])) as any[];
          log("SCHEME_SEARCH_SUCCESS", { count: schemes.length });
        } catch (e: any) {
          log("SCHEME_SEARCH_FAILED", { error: e.message });
          schemes = [];
        }
      }

      const canonicalScheme = schemes && schemes.length > 0 ? schemes[0] : null;

      // 3. Official-source enrichment (bounded, scheme's own URL only)
      let schemeCtx: any = null;
      if (canonicalScheme) {
        log("ENRICHMENT_START", { scheme: canonicalScheme.name, url: canonicalScheme.source_url });
        try {
          schemeCtx = await Promise.race([
            buildSchemeContext(canonicalScheme),
            new Promise((_, r) => setTimeout(() => r(new Error("ENRICHMENT_TIMEOUT")), 20000)),
          ]);
          log("ENRICHMENT_DONE", { source_status: schemeCtx.sourceStatus });
        } catch (e: any) {
          log("ENRICHMENT_FAILED", { error: e.message });
          schemeCtx = null;
        }
      } else {
        log("SCHEME_MATCH_NOT_FOUND");
      }

      // 4. User document context
      const { searchUserDocuments } = await import("./documents.functions");
      let docChunks: any[] = [];
      try {
        docChunks = (await Promise.race([
          searchUserDocuments({ data: { query: content, limit: 5 } }),
          new Promise((_, r) => setTimeout(() => r(new Error("DOC_SEARCH_TIMEOUT")), 5000)),
        ])) as any[];
      } catch (e: any) {
        log("DOC_SEARCH_FAILED", { error: e.message });
        docChunks = [];
      }

      const userDocContext =
        docChunks && docChunks.length > 0
          ? docChunks
              .map(
                (c, i) => `[USER DOCUMENT #${i + 1}] ${c.document_name} (page ${c.page_number || "N/A"}):\n${c.content}`,
              )
              .join("\n---\n")
          : "";

      const otherSchemes =
        schemes.length > 1
          ? schemes
              .slice(1)
              .map((s) => `- ${s.name} (${s.ministry || s.department || "N/A"}) ${s.source_url || ""}`)
              .join("\n")
          : "";

      // Deterministic, source-grounded answer. Computed BEFORE the AI call so it is
      // always available as the fallback, and never depends on the AI service.
      const deterministicAnswer = schemeCtx
        ? renderFallbackAnswer(schemeCtx, intent) +
          (otherSchemes ? `\n\nOTHER RELATED VERIFIED SCHEMES\n${otherSchemes}` : "")
        : renderNoMatchAnswer(content);

      const citations = [
        ...(schemes?.map((s) => ({ type: "govt", name: s.name, url: s.source_url })) || []),
        ...(docChunks?.map((c) => ({
          type: "user_doc",
          name: c.document_name,
          page: c.page_number,
          snippet: (c.content as string).substring(0, 100) + "...",
        })) || []),
      ];

      const saveAssistant = async (text: string, extraMeta: Record<string, unknown>) => {
        const { data: msg, error } = await supabase
          .from("messages")
          .insert({
            conversation_id: currentConversationId!,
            role: "assistant",
            content: text,
            metadata: {
              sources: citations,
              canonical_scheme_id: canonicalScheme?.id || null,
              intent,
              source_status: schemeCtx?.sourceStatus || "none",
              source_checked_at: schemeCtx?.sourceLastChecked || null,
              ...extraMeta,
            },
          })
          .select()
          .single();
        if (error) {
          log("DATABASE_SAVE_ASSISTANT_FAILED", { error });
          throw new Error("Failed to save assistant response");
        }
        
        // Fire-and-forget conversation update to avoid blocking the main response
        supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", currentConversationId!)
          .then(({ error: updateError }) => {
            if (updateError) log("CONVERSATION_UPDATE_FAILED", { error: updateError });
          });
          
        return msg;
      };

      // 5. Optional AI enrichment. The AI explains the source; it never replaces it.
      log("AI_REQUEST_START");
      try {
        const { createAiGateway } = await import("@/lib/ai-gateway.server");
        const ai = createAiGateway();

        const systemPrompt = `You are GovCopilot, the official AI Government Scheme Assistant for Indian citizens.

CRITICAL INSTRUCTIONS:
1. Answer ONLY about the canonical scheme identified below. Never substitute another scheme.
2. Use ONLY the structured official context provided. Any field marked NULL is unknown — say it is not available in the official source. NEVER invent eligibility, benefits, amounts, deadlines, launch dates, application steps, documents or departments.
3. The user's intent for this turn is: ${intent}. Lead with the information that answers it.
4. Always end with the official source name, source URL and when the source was last checked.

STRUCTURED OFFICIAL CONTEXT:
${schemeCtx ? renderAiContext(schemeCtx) : "NO_SCHEME_MATCH"}

OTHER RELATED VERIFIED SCHEMES:
${otherSchemes || "NONE"}

USER'S PERSONAL DOCUMENTS:
${userDocContext || "NONE"}`;

        const { data: history } = await supabase
          .from("messages")
          .select("role, content")
          .eq("conversation_id", currentConversationId)
          .order("created_at", { ascending: false })
          .limit(10);

        const messages = [
          { role: "system", content: systemPrompt },
          ...(history?.reverse().map((m) => ({ role: m.role as "user" | "assistant", content: m.content })) || []),
        ];

        const response = (await Promise.race([
          ai.chat.completions.create({ model: "gpt-4o", messages: messages as any, temperature: 0.1 }),
          new Promise((_, r) => setTimeout(() => r(new Error("AI_REQUEST_TIMEOUT")), 25000)),
        ])) as any;

        const aiContent = response?.choices?.[0]?.message?.content;
        if (!aiContent) throw new Error("AI_EMPTY_RESPONSE");

        log("AI_REQUEST_SUCCESS");
        const finalMsg = await saveAssistant(aiContent, { is_fallback: false });
        log("COPILOT_TERMINAL_SUCCESS", { assistantMsgId: finalMsg.id });
        return { userMessage: userMsg, assistantMessage: finalMsg };
      } catch (err: any) {
        log("AI_UNAVAILABLE_USING_DETERMINISTIC_FALLBACK", { error: err.message, status: err.status });
        const finalMsg = await saveAssistant(deterministicAnswer, {
          is_fallback: true,
          error_code: err.message === "AI_REQUEST_TIMEOUT" ? "AI_TIMEOUT" : "AI_UNAVAILABLE",
        });
        log("COPILOT_TERMINAL_FALLBACK", { assistantMsgId: finalMsg.id });
        return { userMessage: userMsg, assistantMessage: finalMsg };
      }
    } catch (err: any) {
      log("COPILOT_TERMINAL_FATAL", { error: err.message });
      throw new Error(`Citizen Copilot encountered an unexpected error: ${err.message}`);
    }
  });
