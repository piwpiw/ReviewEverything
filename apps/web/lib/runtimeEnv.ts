export const REQUIRED_DB_ENV: string[] = ["DATABASE_URL", "DIRECT_URL"];
export const REQUIRED_RUNTIME_ENV: string[] = ["DATABASE_URL", "DIRECT_URL", "CRON_SECRET"];

export function isProductionRuntime(): boolean {
    return process.env.NODE_ENV === "production";
}

export function getMissingEnvVars(keys: readonly string[] = REQUIRED_RUNTIME_ENV): string[] {
    return keys.filter((name) => {
        const value = process.env[name];
        return typeof value !== "string" || value.trim().length === 0;
    });
}

export function assertRequiredRuntimeEnv(keys: readonly string[] = REQUIRED_RUNTIME_ENV): void {
    const missing = getMissingEnvVars(keys);
    if (missing.length === 0) {
        return;
    }

    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

export function getEnvironmentMode(): "local" | "production" {
    return isProductionRuntime() ? "production" : "local";
}
