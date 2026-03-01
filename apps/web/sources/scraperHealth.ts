import { InitializedAdapters } from './registry';
import { IPlatformAdapter } from './types';

export interface AdapterHealthResult {
    name: string;
    status: 'ok' | 'warn' | 'error';
    itemCount: number;
    latencyMs: number;
    error?: string;
}

export async function checkAdapterHealth(
    name: string,
    adapter: IPlatformAdapter,
): Promise<AdapterHealthResult> {
    const start = Date.now();
    try {
        const items = await adapter.fetchList(1);
        const latencyMs = Date.now() - start;
        return {
            name,
            status: items.length > 0 ? 'ok' : 'warn',
            itemCount: items.length,
            latencyMs,
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[ScraperHealth] adapter=${name} error:`, message);
        return {
            name,
            status: 'error',
            itemCount: 0,
            latencyMs: Date.now() - start,
            error: message,
        };
    }
}

export async function checkAllAdapters(): Promise<AdapterHealthResult[]> {
    const entries = Object.entries(InitializedAdapters);
    const results = await Promise.allSettled(
        entries.map(([name, adapter]) => checkAdapterHealth(name, adapter)),
    );

    return results.map((result, i) => {
        if (result.status === 'fulfilled') return result.value;
        const errMsg =
            result.reason instanceof Error ? result.reason.message : String(result.reason);
        console.error(`[ScraperHealth] allSettled rejection for ${entries[i][0]}:`, errMsg);
        return {
            name: entries[i][0],
            status: 'error' as const,
            itemCount: 0,
            latencyMs: 0,
            error: errMsg,
        };
    });
}
