// RFC 4180 CSV: quote fields that contain a comma, quote, or newline; double inner quotes.
export function toCsv(columns: string[], rows: Record<string, unknown>[]): string {
	const cell = (v: unknown) => {
		if (v === null || v === undefined) return "";
		const s = String(v);
		return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
	};
	return [columns.join(","), ...rows.map((r) => columns.map((c) => cell(r[c])).join(","))].join("\n") + "\n";
}
