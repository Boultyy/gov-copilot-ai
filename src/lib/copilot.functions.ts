import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export { startNewConversation, getConversations, getConversationMessages } from "./copilot.functions.original";

export const sendCopilotMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { conversationId?: string; content: string }) =>
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
        log("AUTO_CREATE_CONVERSATION_START");
        const { data: newConv, error: convError } = await supabase
          .from("conversations")
          .insert({
            user_id: userId,
            title: content.slice(0, 50),
            type: "copilot"
          })
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
      const { error: userMsgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: currentConversationId,
          role: "user",
          content: content
        });

      if (userMsgError) {
        log("COPILOT_FATAL_ERROR", { error: "Failed to save user message", details: userMsgError });
        throw new Error("Failed to save user message");
      }

      // 2. Retrieve Government Context (Enhanced Scheme Search)
      log("SCHEME_SEARCH_START");
      const { searchSchemes, fetchOfficialSchemeDetail } = await import("./schemes.server");
      
      let schemes: any[] = [];
      const inheritedSchemeId = currentConversationId ? await getContextSchemeId(currentConversationId) : null;
      
      if (inheritedSchemeId) {
        log("INHERITED_SCHEME_FOUND", { id: inheritedSchemeId });
        const { data: inherited } = await supabase
          .from("schemes")
          .select("*")
          .eq("id", inheritedSchemeId)
          .single();
        if (inherited) schemes = [inherited];
      }

      if (schemes.length === 0) {
        const schemesPromise = searchSchemes(content);
        const schemesTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("SCHEME_SEARCH_TIMEOUT")), 5000)
        );
        
        try {
          schemes = await Promise.race([schemesPromise, schemesTimeoutPromise]) as any[];
          log("SCHEME_SEARCH_SUCCESS", { count: schemes.length });
        } catch (e: any) {
          log("SCHEME_SEARCH_FAILED", { error: e.message });
          schemes = [];
        }
      }

      // 3. Official Web Enrichment
      let webContext = "";
      if (schemes && schemes.length > 0) {
        const topScheme = schemes[0];
        log("SCHEME_MATCH_FOUND", { name: topScheme.name, id: topScheme.id });
        
        const needsDeepInfo = /eligib|benefit|apply|document|how to|process|register|cost|fee|deadline/i.test(content);
        
        if (needsDeepInfo && topScheme.source_url) {
          log("SOURCE_FETCH_START", { url: topScheme.source_url });
          try {
            const officialText = await fetchOfficialSchemeDetail(topScheme.source_url);
            if (officialText) {
              log("SOURCE_FETCH_SUCCESS", { textLen: officialText.length });
              webContext = `
                [ADDITIONAL CURRENT INFO FROM OFFICIAL SOURCE: ${topScheme.source_url}]
                ${officialText}
              `;
            } else {
              log("SOURCE_FETCH_FAILED", { reason: "No text returned" });
            }
          } catch (e: any) {
            log("SOURCE_FETCH_FAILED", { error: e.message });
          }
        }
      } else {
        log("SCHEME_MATCH_NOT_FOUND");
      }

      // 4. Retrieve User Document Context
      log("DOC_SEARCH_START");
      const { searchUserDocuments } = await import("./documents.functions");
      let docChunks: any[] = [];
      try {
        const docPromise = searchUserDocuments({ data: { query: content, limit: 5 } });
        const docTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("DOC_SEARCH_TIMEOUT")), 5000)
        );
        docChunks = await Promise.race([docPromise, docTimeoutPromise]) as any[];
        log("DOC_SEARCH_SUCCESS", { count: docChunks.length });
      } catch (e: any) {
        log("DOC_SEARCH_FAILED", { error: e.message });
        docChunks = [];
      }

      // 5. Build Context
      const schemeContext = schemes && schemes.length > 0 
        ? schemes.map(s => `
          [GOVERNMENT SCHEME]
          Name: ${s.name}
          Official Name: ${s.official_name || s.name}
          Ministry/Department: ${s.ministry || s.department || 'N/A'}
          Benefits: ${s.benefits || 'Check official source'}
          Eligibility: ${s.eligibility_summary || 'Check official source'}
          Source: ${s.source_name || 'Official Government Source'}
          Official URL: ${s.source_url || 'N/A'}
        `).join("\n---\n")
        : "";

      const userDocContext = docChunks && docChunks.length > 0
        ? docChunks.map((c, i) => `
          [USER DOCUMENT SOURCE #${i+1}]
          Document: ${c.document_name}
          Content Snippet: ${c.content}
          Page: ${c.page_number || 'N/A'}
        `).join("\n---\n")
        : "";

      const canonicalScheme = schemes && schemes.length > 0 ? schemes[0] : null;

      const combinedContext = `
        CANONICAL_SCHEME_ID: ${canonicalScheme?.id || "NONE"}
        CANONICAL_SCHEME_NAME: ${canonicalScheme?.name || "NONE"}
        OFFICIAL_NAME: ${canonicalScheme?.official_name || "NONE"}
        MINISTRY: ${canonicalScheme?.ministry || "NONE"}
        DEPARTMENT: ${canonicalScheme?.department || "NONE"}
        OFFICIAL_SOURCE: ${canonicalScheme?.official_source || "NONE"}
        SOURCE_URL: ${canonicalScheme?.source_url || "NONE"}

        VERIFIED GOVERNMENT DATABASE RECORDS:
        ${schemeContext || "No specific government schemes found in database matching this query."}
        
        ${webContext ? `LIVE OFFICIAL WEB EVIDENCE:\n${webContext}` : ""}

        USER'S PERSONAL DOCUMENTS:
        ${userDocContext || "No relevant information found in the user's uploaded documents."}
      `;

      // 6. Call AI Gateway
      log("AI_REQUEST_START");
      const { createAiGateway } = await import("@/lib/ai-gateway.server");
      const ai = createAiGateway();

      const systemPrompt = `
        You are GovCopilot, the official AI Government Scheme Assistant for Indian citizens.
        
        CRITICAL INSTRUCTIONS:
        1. Primary Duty: Help citizens discover, understand, and access government schemes using ONLY the provided Verified Government Information.
        2. Grounding: You MUST answer about the canonical scheme identified above (CANONICAL_SCHEME_NAME). Do not substitute another scheme.
        3. Anti-Hallucination: DO NOT invent scheme names, eligibility rules, benefit amounts, launch dates, or application URLs. If information is missing, use ONLY the database fields or official web evidence provided.
        4. Citations: Always mention the scheme name and link to the official URL provided in the context.
        5. Tone: Professional, clear, helpful, and empathetic.
        
        CONTEXT:
        ${combinedContext}
      `;

      const { data: history } = await supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", currentConversationId)
        .order("created_at", { ascending: false })
        .limit(10);
      
      const messages = [
        { role: "system", content: systemPrompt },
        ...(history?.reverse().map(m => ({ role: m.role as "user" | "assistant", content: m.content })) || []),
        { role: "user", content: content }
      ];

      try {
        const aiPromise = ai.chat.completions.create({
          model: "gpt-4o",
          messages: messages as any,
          temperature: 0.1,
        });

        const aiTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("AI_REQUEST_TIMEOUT")), 30000)
        );

        const response = await Promise.race([aiPromise, aiTimeoutPromise]) as any;
        log("AI_REQUEST_SUCCESS");

        const aiContent = response.choices[0].message.content || "I apologize, but I am unable to process your request at the moment.";

        const citations = [
          ...(schemes?.map(s => ({ type: 'govt', name: s.name, url: s.source_url })) || []),
          ...(docChunks?.map(c => ({ 
            type: 'user_doc', 
            name: c.document_name, 
            page: c.page_number,
            snippet: (c.content as string).substring(0, 100) + "..."
          })) || [])
        ];

        const canonicalSchemeId = schemes && schemes.length > 0 ? schemes[0].id : null;

        const { data: aiMsg, error: aiMsgError } = await supabase
          .from("messages")
          .insert({
            conversation_id: currentConversationId,
            role: "assistant",
            content: aiContent,
            metadata: { 
              sources: citations,
              canonical_scheme_id: canonicalSchemeId
            }
          })
          .select()
          .single();

        if (aiMsgError) throw new Error("Failed to save AI response");

        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", currentConversationId);

        log("COPILOT_RESPONSE_READY");
        return aiMsg;
      } catch (err: any) {
        log("AI_REQUEST_FAILED", { error: err.message, status: err.status });
        
        if (schemes && schemes.length > 0) {
          const topScheme = schemes[0];
          const fallbackContent = `${topScheme.name} is available in the GovCopilot government-scheme database. I can retrieve its official scheme record, but the AI explanation service is temporarily unavailable. 

Ministry: ${topScheme.ministry || 'N/A'}
Benefits: ${topScheme.benefits || 'Available in official documentation'}

You can open the official source below for detailed information.`;
          
          log("FALLBACK_TRIGGERED", { scheme: topScheme.name });
          
          const { data: fallbackMsg } = await supabase
            .from("messages")
            .insert({
              conversation_id: currentConversationId,
              role: "assistant",
              content: fallbackContent,
              metadata: { 
                sources: [{ type: 'govt', name: topScheme.name, url: topScheme.source_url }],
                is_fallback: true,
                error_code: err.message === "AI_REQUEST_TIMEOUT" ? "AI_TIMEOUT" : "AI_UNAVAILABLE",
                canonical_scheme_id: topScheme.id
              }
            })
            .select()
            .single();
            
          return fallbackMsg;
        }

        throw err;
      }
    } catch (err: any) {
      log("COPILOT_FATAL_ERROR", { error: err.message });
      if (err.message === "AI_REQUEST_TIMEOUT" || err.message === "AI_UNAVAILABLE" || err.status === 404 || err.message?.includes("404")) {
         throw new Error("Citizen Copilot is temporarily unavailable due to a service configuration issue. Please try again later.");
      }
      throw new Error(`Citizen Copilot encountered an unexpected error: ${err.message}`);
    }
  });
