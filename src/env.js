import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export function loadEnv(rootDir = process.cwd()) {
  const envPath = path.join(rootDir, ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf-8").split(/\r?\n/u);

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/gu, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
