// Filter, sort, and aggregate dataset rows. Used by the MCP endpoint; pure so it can be tested directly.
export type Value = string | number | null;
export type Row = Record<string, Value>;

export interface Filter {
	column: string;
	op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "in";
	value: Value | Value[];
}
export interface QueryOpts {
	columns?: string[];
	filters?: Filter[];
	sort?: { column: string; desc?: boolean };
	limit?: number;
}
export interface AggregateOpts {
	filters?: Filter[];
	group_by: string[];
	metrics: { column: string; fn: "sum" | "avg" | "min" | "max" | "count" }[];
	sort?: { column: string; desc?: boolean };
	limit?: number;
}

export const MAX_ROWS = 1000;

const compare = (a: Value, b: Value) => {
	if (a == null) return b == null ? 0 : 1; // nulls last
	if (b == null) return -1;
	return typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b));
};

const matches = (r: Row, f: Filter) => {
	const v = r[f.column] ?? null;
	const t = f.value;
	switch (f.op) {
		case "eq":
			return v == t || String(v) === String(t);
		case "neq":
			return !(v == t || String(v) === String(t));
		case "gt":
			return v != null && compare(v, t as Value) > 0;
		case "gte":
			return v != null && compare(v, t as Value) >= 0;
		case "lt":
			return v != null && compare(v, t as Value) < 0;
		case "lte":
			return v != null && compare(v, t as Value) <= 0;
		case "contains":
			return v != null && String(v).toLowerCase().includes(String(t).toLowerCase());
		case "in":
			return Array.isArray(t) && t.some((x) => String(x) === String(v));
	}
};

const limitOf = (n?: number) => Math.min(Math.max(1, Math.floor(n ?? 100)), MAX_ROWS);

export function query(rows: Row[], o: QueryOpts) {
	let out = rows.filter((r) => (o.filters ?? []).every((f) => matches(r, f)));
	const matched = out.length;
	if (o.sort) out = out.sort((a, b) => compare(a[o.sort!.column] ?? null, b[o.sort!.column] ?? null) * (o.sort!.desc ? -1 : 1));
	out = out.slice(0, limitOf(o.limit));
	if (o.columns?.length) out = out.map((r) => Object.fromEntries(o.columns!.map((c) => [c, r[c] ?? null])));
	return { matched, returned: out.length, rows: out };
}

export function aggregate(rows: Row[], o: AggregateOpts) {
	const groups = new Map<string, { key: Row; acc: { sum: number; n: number; min: number; max: number }[] }>();
	for (const r of rows) {
		if (!(o.filters ?? []).every((f) => matches(r, f))) continue;
		const key = Object.fromEntries(o.group_by.map((c) => [c, r[c] ?? null]));
		const id = JSON.stringify(key);
		let g = groups.get(id);
		if (!g) groups.set(id, (g = { key, acc: o.metrics.map(() => ({ sum: 0, n: 0, min: Infinity, max: -Infinity })) }));
		o.metrics.forEach((m, i) => {
			const v = r[m.column];
			if (m.fn === "count") return void g!.acc[i]!.n++;
			if (typeof v !== "number") return;
			const a = g!.acc[i]!;
			a.sum += v;
			a.n++;
			a.min = Math.min(a.min, v);
			a.max = Math.max(a.max, v);
		});
	}
	let out: Row[] = [...groups.values()].map(({ key, acc }) => ({
		...key,
		...Object.fromEntries(
			o.metrics.map((m, i) => {
				const a = acc[i]!;
				const v = m.fn === "count" ? a.n : !a.n ? null : m.fn === "sum" ? a.sum : m.fn === "avg" ? a.sum / a.n : m.fn === "min" ? a.min : a.max;
				return [`${m.fn}_${m.column}`, v];
			}),
		),
	}));
	const groupCount = out.length;
	const sort = o.sort ?? (o.group_by[0] ? { column: o.group_by[0] } : undefined);
	if (sort) out = out.sort((a, b) => compare(a[sort.column] ?? null, b[sort.column] ?? null) * (sort.desc ? -1 : 1));
	return { groups: groupCount, returned: Math.min(groupCount, limitOf(o.limit)), rows: out.slice(0, limitOf(o.limit)) };
}
