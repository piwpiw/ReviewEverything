import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Enhanced fetcher with exponential backoff and retry logic.
 * Default: 3 retries, starting at 1000ms delay.
 */
export async function fetchWithRetry(
    url: string,
    options?: AxiosRequestConfig,
    maxRetries: number = 3,
    baseDelayMs: number = 1000
): Promise<AxiosResponse> {
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            return await axios.get(url, {
                ...options,
                timeout: options?.timeout || 15000,
            });
        } catch (error: any) {
            attempt++;

            // Only retry on certain errors: Network timeouts, 5xx server errors, or generic ECONNRESETs
            const isRetryable =
                !error.response ||
                (error.response.status >= 500 && error.response.status < 600) ||
                error.code === 'ECONNABORTED' ||
                error.code === 'ECONNRESET';

            if (!isRetryable || attempt >= maxRetries) {
                throw error;
            }

            // Exponential backoff with jitter
            const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 500;
            console.warn(`[Fetcher] Request failed: ${error.message}. Retrying (${attempt}/${maxRetries}) in ${Math.round(delay)}ms... -> ${url}`);

            await new Promise(res => setTimeout(res, delay));
        }
    }

    throw new Error("fetchWithRetry: Impossible state reached.");
}
