export const SUPPORTED_LANGUAGES = [
  { id: "typescript", label: "TypeScript", extensions: [".ts", ".tsx"] },
  { id: "javascript", label: "JavaScript", extensions: [".js", ".jsx", ".mjs", ".cjs"] },
  { id: "python", label: "Python", extensions: [".py", ".pyw"] },
  { id: "go", label: "Go", extensions: [".go"] },
  { id: "rust", label: "Rust", extensions: [".rs"] },
  { id: "java", label: "Java", extensions: [".java"] },
  { id: "cpp", label: "C++", extensions: [".cpp", ".cc", ".cxx", ".hpp", ".h"] },
  { id: "c", label: "C", extensions: [".c"] },
  { id: "csharp", label: "C#", extensions: [".cs"] },
  { id: "ruby", label: "Ruby", extensions: [".rb"] },
  { id: "php", label: "PHP", extensions: [".php"] },
  { id: "swift", label: "Swift", extensions: [".swift"] },
  { id: "kotlin", label: "Kotlin", extensions: [".kt", ".kts"] },
  { id: "sql", label: "SQL", extensions: [".sql"] },
  { id: "shell", label: "Shell / Bash", extensions: [".sh", ".bash", ".zsh"] },
  { id: "html", label: "HTML", extensions: [".html", ".htm"] },
  { id: "css", label: "CSS", extensions: [".css", ".scss", ".less"] },
  { id: "json", label: "JSON", extensions: [".json"] },
  { id: "yaml", label: "YAML", extensions: [".yaml", ".yml"] },
  { id: "plaintext", label: "Plain Text", extensions: [".txt", ".log"] },
];

const EXTENSION_MAP: Record<string, string> = {};
for (const lang of SUPPORTED_LANGUAGES) {
  for (const ext of lang.extensions) {
    EXTENSION_MAP[ext.toLowerCase()] = lang.label;
  }
}

export function detectLanguageFromFilename(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return "Plain Text";
  const ext = filename.slice(dotIndex).toLowerCase();
  return EXTENSION_MAP[ext] || "Source Code";
}

export function detectLanguageFromCode(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return "TypeScript";

  if (trimmed.startsWith("<?php")) return "PHP";
  if (trimmed.startsWith("#!/bin/bash") || trimmed.startsWith("#!/bin/sh")) return "Shell / Bash";
  if (trimmed.startsWith("<!DOCTYPE html>") || /<html[\s>]/i.test(trimmed)) return "HTML";
  if (/^(\{|\[)[\s\S]*(\}|\])$/.test(trimmed) && (trimmed.includes('":') || trimmed.includes("':"))) return "JSON";

  // Rust
  if (/\b(fn\s+\w+|impl\s+|pub\s+struct|let\s+mut|match\s+\w+|println!)\b/.test(trimmed)) {
    return "Rust";
  }

  // Go
  if (/\b(package\s+\w+|func\s+\w+|fmt\.Println|go\s+func)\b/.test(trimmed)) {
    return "Go";
  }

  // Python
  if (/\b(def\s+\w+\(.*\):|class\s+\w+.*:|import\s+\w+|from\s+\w+\s+import|elif\s+|if\s+__name__\s*==\s*['"]__main__['"])\b/.test(trimmed)) {
    return "Python";
  }

  // TypeScript / JavaScript
  if (/\b(interface\s+\w+|type\s+\w+\s*=|const\s+\w+:\s*\w+|export\s+default\s+|import\s+.*from\s+['"]|function\s+\w+\()/i.test(trimmed)) {
    if (/\b(interface\s+|type\s+\w+\s*=|:\s*(string|number|boolean|any|void))\b/.test(trimmed)) {
      return "TypeScript";
    }
    return "JavaScript";
  }

  // Java
  if (/\b(public\s+class|private\s+void|System\.out\.println|package\s+com\.)\b/.test(trimmed)) {
    return "Java";
  }

  // C++
  if (/\b(#include\s*<iostream>|std::cout|std::vector|namespace\s+\w+)\b/.test(trimmed)) {
    return "C++";
  }

  // C
  if (/\b(#include\s*<stdio\.h>|int\s+main\s*\(|printf\s*\()\b/.test(trimmed)) {
    return "C";
  }

  // SQL
  if (/\b(SELECT\s+.*\s+FROM|INSERT\s+INTO|CREATE\s+TABLE|ALTER\s+TABLE|UPDATE\s+.*\s+SET)\b/i.test(trimmed)) {
    return "SQL";
  }

  return "TypeScript";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "out",
  ".turbo",
  ".idea",
  ".vscode",
  "coverage",
  "__pycache__",
  ".pytest_cache",
  "target",
  "vendor",
  ".cache",
]);

export function isIgnoredPath(path: string): boolean {
  const parts = path.split(/[/\\]/);
  return parts.some((p) => IGNORED_DIRS.has(p.toLowerCase()));
}
