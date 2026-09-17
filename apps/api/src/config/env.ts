import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPaths = [
  resolve(__dirname, "../../.env"),
  resolve(__dirname, "../../../.env")
];

for (const envPath of envPaths) {
  if (!existsSync(envPath)) {
    continue;
  }

  const envFile = readFileSync(envPath, "utf8");

  for (const line of envFile.split("\n")) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex);
    const value = trimmedLine.slice(separatorIndex + 1);

    process.env[key] ??= value;
  }
}

const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
}

if (
  process.env.NODE_ENV === "production" &&
  process.env.JWT_SECRET === "change-me-in-development"
) {
  throw new Error("JWT_SECRET must be changed for production.");
}
