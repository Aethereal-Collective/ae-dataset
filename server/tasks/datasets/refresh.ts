export default defineTask({
	meta: { name: "datasets:refresh", description: "Rebuild all datasets from their sources" },
	async run() {
		return { result: await refreshInChild(false) };
	},
});
