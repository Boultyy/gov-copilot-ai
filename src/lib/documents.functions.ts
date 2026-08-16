import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import pdf from "pdf-parse-fork";
import mammoth from "mammoth";

/**
 * Handles document upload metadata and triggers processing.
 */
export const uploadDocumentMetadata = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { name: string; storage_path: string; size_bytes: number; mime_type: string }) =>
    z.object({
      name: z.string(),
      storage_path: z.string(),
      size_bytes: z.number(),
      mime_type: z.string()
    }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: doc, error } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        name: data.name,
        storage_path: data.storage_path,
        size_bytes: data.size_bytes,
        mime_type: data.mime_type,
        status: "processing"
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating document record:", error);
      throw new Error("Failed to create document record");
    }

    // Trigger processing (async)
    processDocument({ data: { documentId: doc.id } }).catch(console.error);

    return doc;
  });

/**
 * Internal function to process documents (extract text, chunk, embed).
 */
export const processDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { documentId: string }) =>
    z.object({ documentId: z.string().uuid() }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { documentId } = data;

    try {
      // 1. Get document details
      const { data: doc, error: docError } = await supabaseAdmin
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .eq("user_id", userId)
        .single();

      if (docError || !doc) throw new Error("Document not found");

      // 2. Download from Storage
      const { data: fileData, error: downloadError } = await supabaseAdmin
        .storage
        .from("documents")
        .download(doc.storage_path);

      if (downloadError || !fileData) throw new Error("Failed to download document");

      // 3. Extract Text
      let text = "";
      const buffer = Buffer.from(await fileData.arrayBuffer());

      if (doc.mime_type === "application/pdf") {
        const pdfData = await pdf(buffer);
        text = pdfData.text;
      } else if (
        doc.mime_type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        doc.name.endsWith(".docx")
      ) {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else if (doc.mime_type === "text/plain" || doc.name.endsWith(".txt")) {
        text = buffer.toString("utf-8");
      } else {
        throw new Error(`Unsupported file type: ${doc.mime_type}`);
      }

      if (!text || text.trim().length === 0) {
        throw new Error("Document appears to be empty or text could not be extracted.");
      }

      // 4. Chunking (Overlap for better context)
      const chunks = splitTextIntoChunks(text, 1000, 200);

      // 5. Generate Embeddings & Save
      const { createAiGateway } = await import("@/lib/ai-gateway.server");
      const ai = createAiGateway();

      // Delete existing chunks if any (re-processing)
      await supabaseAdmin
        .from("document_chunks")
        .delete()
        .eq("document_id", documentId);

      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];
        
        const embeddingResponse = await ai.embeddings.create({
          model: "text-embedding-3-small",
          input: chunkText,
        });

        const embedding = embeddingResponse.data[0].embedding;

        await supabaseAdmin
          .from("document_chunks")
          .insert({
            document_id: documentId,
            chunk_index: i,
            content: chunkText,
            embedding: `[${embedding.join(",")}]` as any,
            metadata: { 
              source: doc.name,
              chunk_size: chunkText.length,
              processed_at: new Date().toISOString()
            }
          });
      }

      // 6. Update Status
      await supabaseAdmin
        .from("documents")
        .update({ status: "ready", error_message: null })
        .eq("id", documentId);

    } catch (err: any) {
      console.error("Processing error:", err);
      await supabaseAdmin
        .from("documents")
        .update({ 
          status: "failed",
          error_message: err.message || "Unknown error during processing"
        })
        .eq("id", documentId);
    }
  });

/**
 * Semantic search across user's documents.
 */
export const searchUserDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { query: string; limit?: number }) =>
    z.object({
      query: z.string().min(1),
      limit: z.number().optional().default(5)
    }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { query, limit } = data;

    // 1. Generate Query Embedding
    const { createAiGateway } = await import("@/lib/ai-gateway.server");
    const ai = createAiGateway();
    
    const embeddingResponse = await ai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 2. Perform Vector Search via RPC
    const { data: results, error } = await supabaseAdmin.rpc("match_document_chunks", {
      query_embedding: `[${queryEmbedding.join(",")}]` as any,
      match_threshold: 0.3, // Lowered threshold for better recall
      match_count: limit,
      p_user_id: userId
    });

    if (error) {
      console.error("Vector search error:", error);
      throw new Error("Failed to search documents");
    }

    return results;
  });

/**
 * Fetches user's documents.
 */
export const getDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error("Failed to fetch documents");
    return data;
  });

/**
 * Deletes a document and its chunks.
 */
export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { documentId: string; storagePath: string }) =>
    z.object({ documentId: z.string().uuid(), storagePath: z.string() }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 1. Delete from Storage
    await supabase.storage.from("documents").remove([data.storagePath]);

    // 2. Delete from Database (cascades handle chunks)
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", data.documentId)
      .eq("user_id", userId);

    if (error) throw new Error("Failed to delete document");
    return { success: true };
  });

// Utility: Improved chunking with overlap
function splitTextIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + chunkSize;
    
    // If not at the end, try to find a newline or space to break at
    if (end < text.length) {
      const lastNewline = text.lastIndexOf("\n", end);
      if (lastNewline > start + chunkSize / 2) {
        end = lastNewline + 1;
      } else {
        const lastSpace = text.lastIndexOf(" ", end);
        if (lastSpace > start + chunkSize / 2) {
          end = lastSpace + 1;
        }
      }
    }
    
    chunks.push(text.substring(start, end).trim());
    start = end - overlap;
    if (start < 0) start = end; // Safety
  }
  
  return chunks.filter(c => c.length > 0);
}
