import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import type { AxiosError } from 'axios';

const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0",
];

function getRandomUA() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

const MAX_RETRY_DELAY_MS = 120_000;
const BOT_BLOCK_HINTS = [/captcha/i, /access denied/i, /verify/i, /forbidden/i, /too many requests/i];

function toMs(value: unknown) {
    return Number.isFinite(Number(value)) ? Number(value) : 0;
}

type FetchFailureCategory =
    | "http_403_rate_limit"
    | "http_429_rate_limit"
    | "http_5xx"
    | "http_4xx"
    | "timeout"
    | "network"
    | "empty_html"
    | "bot_challenge"
    | "unknown_retryable"
    | "non_retryable";

type FetchFailureContext = {
    category: FetchFailureCategory;
    status?: number;
    retryAfterMs: number;
    retryable: boolean;
};

function looksLikeBotChallenge(content: unknown) {
    if (typeof content !== "string" || content.length < 32) return false;
    return BOT_BLOCK_HINTS.some((pattern) => pattern.test(content));
}

function classifyAxiosError(error: AxiosError<unknown, any>): FetchFailureContext {
    const status = error.response?.status;
    const statusText = error.response?.statusText;
    const retryAfterMs = parseRetryAfter(error.response?.headers?.["retry-after"]);
    const hasRetryAfter = retryAfterMs > 0;

    if (status) {
        if (status === 403) {
            return {
                category: looksLikeBotChallenge(error.response?.data) ? "bot_challenge" : "http_403_rate_limit",
                status,
                retryAfterMs,
                retryable: true,
            };
        }
        if (status === 429) {
            return {
                category: "http_429_rate_limit",
                status,
                retryAfterMs,
                retryable: true,
            };
        }
        if (status >= 500 && status < 600) {
            return {
                category: "http_5xx",
                status,
                retryAfterMs,
                retryable: true,
            };
        }
        if (status === 408 || status === 410 || status === 423) {
            return {
                category: "http_4xx",
                status,
                retryAfterMs: hasRetryAfter ? retryAfterMs : 0,
                retryable: true,
            };
        }
        return {
            category: "non_retryable",
            status,
            retryAfterMs: 0,
            retryable: false,
        };
    }

    if (typeof error.code === "string") {
        if (error.code === "ECONNABORTED") {
            return {
                category: "timeout",
                retryAfterMs: 0,
                retryable: true,
            };
        }
        if (error.code === "ENOTFOUND" || error.code === "ECONNRESET" || error.code === "ETIMEDOUT" || error.code === "EPIPE") {
            return {
                category: "network",
                retryAfterMs: 0,
                retryable: true,
            };
        }
    }

    if (looksLikeBotChallenge(error.message)) {
        return {
            category: "bot_challenge",
            retryAfterMs: 0,
            retryable: true,
        };
    }

    return {
        category: "unknown_retryable",
        retryAfterMs: 0,
        retryable: true,
    };
}

function failureCodeFromCategory(context: FetchFailureContext) {
    return context.category;
}

export function extractFetchFailureCode(error: unknown) {
    if (error instanceof Error) {
        const axiosError = error as AxiosError<unknown, any>;
        return failureCodeFromCategory(classifyAxiosError(axiosError));
    }
    return "unknown_retryable";
}

function parseRetryAfter(retryAfter: unknown): number {
    if (!retryAfter) return 0;

    const value = Array.isArray(retryAfter)
        ? retryAfter[0]
        : String(retryAfter);

    if (!value) return 0;

    const secs = toMs(value.match(/^\d+$/) ? Number(value) : NaN);
    if (secs > 0) return secs * 1000;

    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
        return Math.max(0, parsed - Date.now());
    }

    return 0;
}

function calculateDelay(attempt: number, status: number | undefined, retryAfterMs: number, baseDelayMs: number) {
    const basePow = baseDelayMs * Math.pow(2, attempt - 1);
    const retryAfter = Math.max(0, retryAfterMs);
    const delay = retryAfter > 0 ? retryAfter : basePow;
    const jitter = 300 + Math.random() * 700;
    return Math.min(MAX_RETRY_DELAY_MS, delay + jitter);
}

function isRetryableAxiosError(error: AxiosError<unknown, any>) {
    const context = classifyAxiosError(error);
    return context.retryable;
}

function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    return String(error);
}

/**
 * Enhanced fetcher with Bot Evasion, exponential backoff and retry logic.
 */
export async function fetchWithRetry(
    url: string,
    options?: AxiosRequestConfig,
    maxRetries: number = 3,
    baseDelayMs: number = 2000
): Promise<AxiosResponse> {
    let attempt = 0;

    // Merge default browser-like headers
    const defaultHeaders = {
        "User-Agent": getRandomUA(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "max-age=0",
        "Sec-Ch-Ua": '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
    };

    while (attempt < maxRetries) {
        try {
            const config: AxiosRequestConfig = {
                ...options,
                headers: {
                    ...defaultHeaders,
                    ...options?.headers,
                    // Re-randomize UA on each retry attempt if blocked
                    "User-Agent": attempt > 0 ? getRandomUA() : (options?.headers?.["User-Agent"] || defaultHeaders["User-Agent"]),
                },
                timeout: options?.timeout || 20000,
            };

            return await axios.get(url, config);
        } catch (error: any) {
            attempt++;
            const axiosError = error as AxiosError<unknown, any>;
            const status = axiosError.response?.status;
            const statusText = axiosError.response?.statusText;
            const retryAfterMs = parseRetryAfter(axiosError.response?.headers?.['retry-after']);

            const isRetryable = isRetryableAxiosError(axiosError);
            const failureCode = extractFetchFailureCode(axiosError);

            if (!isRetryable || attempt >= maxRetries) {
                console.error(
                    `[Fetcher] Permanently failed: ${getErrorMessage(error)} (${status ?? "no_status"}${statusText ? ` ${statusText}` : ""
                    }) [${failureCode}] for ${url}`,
                );
                throw error;
            }

            const delay = calculateDelay(attempt, status, retryAfterMs, baseDelayMs);

            if (failureCode === "bot_challenge" && attempt === 1) {
                await new Promise((res) => setTimeout(res, Math.min(MAX_RETRY_DELAY_MS, 5_000 + delay)));
                // keep retrying with stronger cooldown first-chance bot/rate controls
            }

            console.warn(
                `[Fetcher] Request failed: ${getErrorMessage(error)}. Retryable(${isRetryable}) code=${failureCode} (${attempt}/${maxRetries}) in ${Math.round(
                    delay,
                )}ms... -> ${url}`,
            );

            await new Promise(res => setTimeout(res, delay));
        }
    }

    throw new Error("fetchWithRetry: Impossible state reached.");
}
