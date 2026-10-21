// Tell Bing, Yandex, and other IndexNow engines (Bing also feeds ChatGPT and Copilot search) that pages changed.
// The key is public by design: it is served at /<key>.txt to prove we own the host.
import { DATASETS, TOPICS } from "../../shared/datasets";

const KEY = "87481e225bb43b86eb5d6609719144ca";

export async function pingIndexNow(site: string) {
	const host = new URL(site).host;
	// Only from the real site, never from local runs.
	// DATA_DIR is only set in the Docker image.
	if (!process.env.DATA_DIR) return;
	const urlList = [site, `${site}/id/data-saham-idx`, ...Object.keys(TOPICS).map((t) => `${site}/topics/${t}`), ...DATASETS.filter(isListed).map((d) => `${site}/datasets/${d.slug}`)];
	try {
		const res = await fetch("https://api.indexnow.org/indexnow", {
			method: "POST",
			headers: { "content-type": "application/json; charset=utf-8" },
			body: JSON.stringify({ host, key: KEY, keyLocation: `${site}/${KEY}.txt`, urlList }),
			signal: AbortSignal.timeout(30_000),
		});
		console.log(`[indexnow] ${urlList.length} urls: HTTP ${res.status}`);
	} catch (e) {
		console.error("[indexnow]", (e as Error).message);
	}
}
