// Dataset refreshes run in a child process so heavy collectors never stall the web server.
// The child is this same server bundle started with REFRESH_ONLY set: it refreshes, then exits.
export default defineNitroPlugin(() => {
	const mode = process.env.REFRESH_ONLY;
	if (mode) {
		void refreshDatasets(mode === "missing").finally(() => process.exit(0));
		return;
	}
	// First boot or a fresh volume: build whatever is missing.
	setTimeout(() => void refreshInChild(true), 5_000);
});
