import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export function readPackageVersion(): string {
  const packagePath = join(
    dirname(fileURLToPath(import.meta.url)),
    "../package.json",
  );
  const raw = readFileSync(packagePath, "utf8");
  const parsed: unknown = JSON.parse(raw);

  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "version" in parsed &&
    typeof parsed.version === "string"
  ) {
    return parsed.version;
  }

  return "0.0.0";
}
