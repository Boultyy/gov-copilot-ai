import pdf from "pdf-parse-fork";
import mammoth from "mammoth";

export type ExtractedPage = { page: number; text: string };
export type ExtractionResult = {
  pages: ExtractedPage[];
  text: string;
  pageCount: number | null;
};

/** Extract text from a PDF while preserving page boundaries. */
export async function extractPdf(buffer: Buffer): Promise<ExtractionResult> {
  const pages: ExtractedPage[] = [];

  const renderPage = async (pageData: any) => {
    const textContent = await pageData.getTextContent({
      normalizeWhitespace: true,
      disableCombineTextItems: false,
    });
    let lastY: number | undefined;
    let text = "";
    for (const item of textContent.items as any[]) {
      const y = item.transform?.[5];
      if (lastY !== undefined && y !== lastY) text += "\n";
      text += item.str;
      lastY = y;
    }
    pages.push({ page: pages.length + 1, text });
    return text;
  };

  const data = await pdf(buffer, { pagerender: renderPage });

  const ordered = pages.length
    ? pages
    : [{ page: 1, text: (data?.text || "").toString() }];

  return {
    pages: ordered.filter((p) => p.text.trim().length > 0),
    text: ordered.map((p) => p.text).join("\n\n"),
    pageCount: data?.numpages ?? ordered.length,
  };
}

/** Extract text from a DOCX, keeping paragraph structure. */
export async function extractDocx(buffer: Buffer): Promise<ExtractionResult> {
  const result = await mammoth.extractRawText({ buffer });
  const text: string = result?.value || "";
  const paragraphs = text
    .split(/\n{1,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  // DOCX has no page concept — group paragraphs into logical sections.
  const perSection = 12;
  const pages: ExtractedPage[] = [];
  for (let i = 0; i < paragraphs.length; i += perSection) {
    pages.push({
      page: pages.length + 1,
      text: paragraphs.slice(i, i + perSection).join("\n"),
    });
  }

  return { pages, text: paragraphs.join("\n"), pageCount: null };
}

export function extractPlainText(buffer: Buffer): ExtractionResult {
  const text = buffer.toString("utf-8");
  return { pages: [{ page: 1, text }], text, pageCount: null };
}

export type Chunk = {
  content: string;
  page: number | null;
  index: number;
};

/** Page-aware chunking with overlap so citations keep a real page number. */
export function chunkPages(
  pages: ExtractedPage[],
  chunkSize = 1200,
  overlap = 180,
): Chunk[] {
  const chunks: Chunk[] = [];
  let index = 0;

  for (const page of pages) {
    const text = page.text.replace(/\s+\n/g, "\n").trim();
    if (!text) continue;

    if (text.length <= chunkSize) {
      chunks.push({ content: text, page: page.page, index: index++ });
      continue;
    }

    let start = 0;
    while (start < text.length) {
      let end = Math.min(start + chunkSize, text.length);
      if (end < text.length) {
        const breakAt = Math.max(
          text.lastIndexOf("\n", end),
          text.lastIndexOf(". ", end),
        );
        if (breakAt > start + chunkSize * 0.5) end = breakAt + 1;
      }
      const slice = text.slice(start, end).trim();
      if (slice) chunks.push({ content: slice, page: page.page, index: index++ });
      if (end >= text.length) break;
      start = Math.max(end - overlap, start + 1);
    }
  }

  return chunks;
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
