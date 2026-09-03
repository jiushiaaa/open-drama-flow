import fs from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";

const decode = value => value.replace(/&#(x[0-9a-f]+|\d+);/gi, (_, number) => String.fromCodePoint(number[0].toLowerCase() === "x" ? parseInt(number.slice(1), 16) : Number(number)))
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

export async function readSourceText(localPath) {
  const extension = path.extname(localPath).toLowerCase();
  const bytes = await fs.readFile(localPath);
  if (bytes.length > 20 * 1024 * 1024) throw new Error("MEMORY_SOURCE_TOO_LARGE");
  if ([".md", ".txt", ".csv", ".json"].includes(extension)) return bytes.toString("utf8");
  if (extension !== ".docx") throw new Error("MEMORY_SOURCE_TEXT_FORMAT_REQUIRED");
  const zip = new AdmZip(bytes);
  const entry = zip.getEntry("word/document.xml");
  if (!entry || entry.header.size > 20 * 1024 * 1024) throw new Error("DOCX_DOCUMENT_INVALID");
  return [...zip.readAsText(entry).matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g)]
    .map(paragraph => [...paragraph[1].matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)].map(match => decode(match[1])).join(""))
    .join("\n");
}
