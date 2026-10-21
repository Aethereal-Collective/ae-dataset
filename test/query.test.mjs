import { test } from "node:test";
import assert from "node:assert/strict";
import { aggregate, query } from "../shared/query.ts";

const rows = [
	{ date: "2025-01-02", ticker: "BBCA", close: 10, volume: 5 },
	{ date: "2025-01-03", ticker: "BBCA", close: 12, volume: null },
	{ date: "2025-01-02", ticker: "BBRI", close: 4, volume: 7 },
	{ date: "2024-12-31", ticker: "BBRI", close: 3, volume: 1 },
];

test("query filters, sorts, limits, and projects", () => {
	const r = query(rows, { filters: [{ column: "date", op: "gte", value: "2025-01-01" }], sort: { column: "close", desc: true }, limit: 2, columns: ["ticker", "close"] });
	assert.equal(r.matched, 3);
	assert.deepEqual(r.rows, [
		{ ticker: "BBCA", close: 12 },
		{ ticker: "BBCA", close: 10 },
	]);
	assert.equal(query(rows, { filters: [{ column: "ticker", op: "in", value: ["BBRI"] }] }).matched, 2);
	assert.equal(query(rows, { limit: 99999 }).returned, 4);
});

test("aggregate groups and skips non-numbers", () => {
	const r = aggregate(rows, { group_by: ["ticker"], metrics: [{ column: "close", fn: "avg" }, { column: "volume", fn: "sum" }, { column: "close", fn: "count" }] });
	assert.deepEqual(r.rows, [
		{ ticker: "BBCA", avg_close: 11, sum_volume: 5, count_close: 2 },
		{ ticker: "BBRI", avg_close: 3.5, sum_volume: 8, count_close: 2 },
	]);
});
