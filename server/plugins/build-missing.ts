// First boot (or a fresh volume): build datasets that don't exist yet, in the background.
export default defineNitroPlugin(() => {
	setTimeout(() => void refreshDatasets(true), 5_000);
});
