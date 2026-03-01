import { fetchWithRetry } from '../lib/fetcher';

async function checkHeaders() {
    try {
        const response = await fetchWithRetry("https://www.revu.net/");
        console.log("Headers:", response.headers);
        console.log("Cookies:", response.headers['set-cookie']);
    } catch (e: any) {
        console.error(e.message);
    }
}

checkHeaders();
