import { CodeFileItem, ProjectSummary } from "./types";
import { detectLanguageFromFilename, isIgnoredPath } from "./languageDetector";

export async function parseZipArchive(file: File): Promise<ProjectSummary> {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const totalBytes = buffer.byteLength;

  // Search for End of Central Directory Record (EOCD signature 0x06054b50)
  // Scanning backwards from the end (max comment size is 65535 + 22 bytes)
  let eocdOffset = -1;
  const searchLimit = Math.max(0, totalBytes - 65557);

  for (let i = totalBytes - 22; i >= searchLimit; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  const files: CodeFileItem[] = [];

  if (eocdOffset !== -1) {
    const totalEntries = view.getUint16(eocdOffset + 10, true);
    const cdOffset = view.getUint32(eocdOffset + 16, true);

    let currentOffset = cdOffset;
    const textDecoder = new TextDecoder("utf-8");

    for (let entryIdx = 0; entryIdx < totalEntries && currentOffset + 46 <= totalBytes; entryIdx++) {
      const sig = view.getUint32(currentOffset, true);
      if (sig !== 0x02014b50) break; // End of entries or mismatch

      const uncompressedSize = view.getUint32(currentOffset + 24, true);
      const nameLength = view.getUint16(currentOffset + 28, true);
      const extraLength = view.getUint16(currentOffset + 30, true);
      const commentLength = view.getUint16(currentOffset + 32, true);

      const nameBytes = new Uint8Array(buffer, currentOffset + 46, nameLength);
      const rawPath = textDecoder.decode(nameBytes);

      // Skip directory entries ending in '/' or ignored paths
      if (!rawPath.endsWith("/") && !isIgnoredPath(rawPath)) {
        const pathParts = rawPath.split("/");
        const fileName = pathParts[pathParts.length - 1];

        // Exclude system files like .DS_Store or Thumbs.db
        if (!fileName.startsWith(".") || fileName.startsWith(".env")) {
          files.push({
            id: `zip-${entryIdx}-${fileName}`,
            name: fileName,
            size: uncompressedSize,
            relativePath: rawPath,
            language: detectLanguageFromFilename(fileName),
          });
        }
      }

      currentOffset += 46 + nameLength + extraLength + commentLength;
    }
  }

  // Calculate language distribution
  const langCounts: Record<string, number> = {};
  let totalProjectSize = 0;

  for (const f of files) {
    totalProjectSize += f.size;
    langCounts[f.language] = (langCounts[f.language] || 0) + 1;
  }

  const languages = Object.entries(langCounts)
    .map(([language, count]) => ({
      language,
      count,
      percentage: Math.round((count / (files.length || 1)) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  const projectName = file.name.replace(/\.zip$/i, "") || "project";

  return {
    name: projectName,
    fileCount: files.length,
    totalSize: totalProjectSize > 0 ? totalProjectSize : file.size,
    languages,
    files,
    sourceType: "zip",
  };
}

export function parseDirectoryFiles(fileList: FileList): ProjectSummary {
  const files: CodeFileItem[] = [];
  let projectName = "Uploaded Project";
  let totalSize = 0;
  const langCounts: Record<string, number> = {};

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const path = file.webkitRelativePath || file.name;

    if (isIgnoredPath(path)) continue;

    // Detect project folder root name if available
    if (file.webkitRelativePath) {
      const parts = file.webkitRelativePath.split("/");
      if (parts.length > 1 && projectName === "Uploaded Project") {
        projectName = parts[0];
      }
    }

    const language = detectLanguageFromFilename(file.name);
    totalSize += file.size;
    langCounts[language] = (langCounts[language] || 0) + 1;

    files.push({
      id: `dir-${i}-${file.name}`,
      name: file.name,
      size: file.size,
      relativePath: path,
      language,
      lastModified: file.lastModified,
    });
  }

  const languages = Object.entries(langCounts)
    .map(([language, count]) => ({
      language,
      count,
      percentage: Math.round((count / (files.length || 1)) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    name: projectName,
    fileCount: files.length,
    totalSize,
    languages,
    files,
    sourceType: "directory",
  };
}
