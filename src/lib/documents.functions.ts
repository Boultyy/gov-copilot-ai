import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ALLOWED_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

/** Creates the document metadata row for an already-uploaded storage object. */
export const uploadDocumentMetadata = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        name: z.string().min(1),
        storage_path: z.string().min(1),
        size_bytes: z.number().int().nonnegative(),
        mime_type: z.string(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (!data.storage_path.startsWith(`${userId}/`)) {
      throw new Error("Invalid storage path for this account.");
    }
    if (data.size_bytes > 25 * 1024 * 1024) {
      throw new Error("File exceeds the 25 MB limit.");
    }

    const { data: doc, error } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        name: data.name,
        storage_path: data.storage_path,
        size_bytes: data.size_bytes,
        mime_type: data.mime_type,
        status: "uploaded",
      })
      .select()
      .single();

    if (error) {
      console.error("[DOCS] metadata insert failed", error);
      throw new Error("Could not save the document record. Please try again.");
    }

    return doc;
  });

/**
 * Full pipeline: download → extract text → chunk → embed/index → AI analysis.
 */
export const processDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ documentId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { documentId } = data;

    const fail = async (message: string, status = "failed") => {
      await supabase
        .from("documents")
        .update({ status, error_message: message, updated_at: new Date().toISOString() })
        .eq("id", documentId)
        .eq("user_id", userId);
      return { status, error: message };
    };

    const setStatus = async (status: string) => {
      await supabase
        .from("documents")
        .update({ status, error_message: null, updated_at: new Date().toISOString() })
        .eq("id", documentId)
        .eq("user_id", userId);
    };

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", userId)
      .maybeSingle();

    if (docError || !doc) return await fail("Document not found.");

    try {
      await setStatus("extracting");

      const { data: fileData, error: downloadError } = await supabase.storage
        .from("documents")
        .download(doc.storage_path);

      if (downloadError || !fileData) {
        return await fail("The stored file could not be downloaded.");
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());
      const lower = doc.name.toLowerCase();
      const {
        extractPdf,
        extractDocx,
        extractPlainText,
        chunkPages,
        countWords,
      } = await import("@/lib/documents.server");

      let extraction;
      if (doc.mime_type === "application/pdf" || lower.endsWith(".pdf")) {
        extraction = await extractPdf(buffer);
      } else if (
        doc.mime_type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        lower.endsWith(".docx")
      ) {
        extraction = await extractDocx(buffer);
      } else if (doc.mime_type === "text/plain" || lower.endsWith(".txt")) {
        extraction = extractPlainText(buffer);
      } else {
        return await fail(`Unsupported file type: ${doc.mime_type || "unknown"}.`);
      }

      const fullText = extraction.text.trim();

      if (fullText.length < 40) {
        const isPdf = doc.mime_type === "application/pdf" || lower.endsWith(".pdf");
        return await fail(
          isPdf
            ? "This PDF appears to be scanned or image-only — no readable text could be extracted. OCR is required before it can be analysed."
            : "No readable text could be extracted from this document.",
          isPdf ? "ocr_required" : "failed",
        );
      }

      const chunks = chunkPages(extraction.pages);
      if (chunks.length === 0) return await fail("Document produced no indexable content.");

      await supabase
        .from("documents")
        .update({
          status: "indexing",
          extracted_text: fullText.slice(0, 400000),
          char_count: fullText.length,
          word_count: countWords(fullText),
          page_count: extraction.pageCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", documentId)
        .eq("user_id", userId);

      // Re-indexing: clear previous chunks
      await supabase.from("document_chunks").delete().eq("document_id", documentId);

      const { createAiGateway, EMBEDDING_MODEL } = await import("@/lib/ai-gateway.server");
      const ai = createAiGateway();

      const batchSize = 32;
      let indexed = 0;
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const embeddingResponse = await ai.embeddings.create({
          model: EMBEDDING_MODEL,
          input: batch.map((c) => c.content),
        });

        const rows = batch.map((chunk, j) => ({
          document_id: documentId,
          content: chunk.content,
          page_number: chunk.page,
          embedding: `[${embeddingResponse.data[j].embedding.join(",")}]` as any,
          metadata: {
            source: doc.name,
            chunk_index: chunk.index,
            page_number: chunk.page,
          },
        }));

        const { error: insertError } = await supabase.from("document_chunks").insert(rows);
        if (insertError) {
          console.error("[DOCS] chunk insert failed", insertError);
          return await fail("Indexing failed while saving document passages.");
        }
        indexed += rows.length;
      }

      // AI analysis — grounded strictly in extracted text
      await setStatus("analyzing");
      let analysis: any = null;
      try {
        analysis = await analyseText(ai, doc.name, fullText);
      } catch (err) {
        console.error("[DOCS] analysis failed", err);
      }

      await supabase
        .from("documents")
        .update({
          status: "ready",
          error_message: analysis ? null : "Indexed successfully, but the AI overview could not be generated.",
          chunk_count: indexed,
          analysis,
          updated_at: new Date().toISOString(),
        })
        .eq("id", documentId)
        .eq("user_id", userId);

      return { status: "ready", chunks: indexed };
    } catch (err: any) {
      console.error("[DOCS] processing error", err);
      return await fail(
        typeof err?.message === "string" && err.message.length < 200
          ? err.message
          : "Processing failed unexpectedly. Please retry.",
      );
    }
  });

async function analyseText(ai: any, name: string, text: string) {
  const { CHAT_MODEL } = await import("@/lib/ai-gateway.server");
  const excerpt = text.slice(0, 60000);

  const completion = await ai.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content:
          "You analyse official Indian government documents. Use ONLY the supplied document text. " +
          "Never invent facts, figures, dates or organisations. If a field is not present, return an empty array or null. " +
          "Respond with strict JSON only, no markdown fences.",
      },
      {
        role: "user",
        content:
          `Document name: ${name}\n\nDocument text:\n"""\n${excerpt}\n"""\n\n` +
          `Return JSON with this exact shape:\n` +
          `{"document_type": string|null, "summary": string, "key_points": string[], "important_dates": [{"date": string, "description": string}], ` +
          `"organizations": string[], "amounts": [{"amount": string, "description": string}], "eligibility": string[], "requirements": string[], "actions": string[]}`,
      },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content?.trim() || "";
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(cleaned);
  return { ...parsed, generated_at: new Date().toISOString() };
}

/** Retrieval-grounded Q&A over the user's own indexed documents. */
export const askDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        question: z.string().min(1),
        documentId: z.string().uuid().nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { createAiGateway, EMBEDDING_MODEL, CHAT_MODEL } = await import(
      "@/lib/ai-gateway.server"
    );
    const ai = createAiGateway();

    const embeddingResponse = await ai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: data.question,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    const { data: matches, error } = await supabase.rpc("match_document_chunks_scoped", {
      query_embedding: `[${queryEmbedding.join(",")}]` as any,
      match_threshold: 0.15,
      match_count: 8,
      p_user_id: userId,
      p_document_id: data.documentId ?? undefined,
    });

    if (error) {
      console.error("[DOCS] retrieval failed", error);
      throw new Error("Document search failed. Please try again.");
    }

    const results = (matches as any[]) || [];
    if (results.length === 0) {
      return {
        answer: "I couldn't find this information in the uploaded document.",
        citations: [],
      };
    }

    const contextBlock = results
      .map(
        (r, i) =>
          `[${i + 1}] Document: ${r.document_name}${r.page_number ? `, page ${r.page_number}` : ""}\n${r.content}`,
      )
      .join("\n\n---\n\n");

    const completion = await ai.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "You answer questions about official documents uploaded by the user. Use ONLY the supplied passages. " +
            "Cite passages inline using [1], [2] markers matching the passage numbers. " +
            "If the passages do not contain the answer, reply exactly: I couldn't find this information in the uploaded document. " +
            "Never rely on outside knowledge and never invent page numbers.",
        },
        { role: "user", content: `Passages:\n\n${contextBlock}\n\nQuestion: ${data.question}` },
      ],
    });

    const answer =
      completion.choices?.[0]?.message?.content?.trim() ||
      "I couldn't find this information in the uploaded document.";

    return {
      answer,
      citations: results.map((r: any, i: number) => ({
        index: i + 1,
        doc: r.document_name,
        page: r.page_number ?? null,
        snippet: (r.content || "").slice(0, 320),
        similarity: r.similarity,
        documentId: r.document_id,
      })),
    };
  });

/** Fetches the current user's documents. */
export const getDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("documents")
      .select(
        "id,name,storage_path,size_bytes,mime_type,status,error_message,page_count,char_count,word_count,chunk_count,analysis,created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error("Failed to fetch documents");
    return data;
  });

/** Deletes a document, its stored file and its indexed chunks. */
export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ documentId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: doc } = await supabase
      .from("documents")
      .select("storage_path")
      .eq("id", data.documentId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!doc) throw new Error("Document not found.");

    await supabase.storage.from("documents").remove([doc.storage_path]);

    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", data.documentId)
      .eq("user_id", userId);

    if (error) throw new Error("Failed to delete document");
    return { success: true };
  });

export { ALLOWED_MIME };
