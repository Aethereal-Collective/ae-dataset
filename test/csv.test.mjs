import { test } from "node:test";
import assert from "node:assert/strict";
import { toCsv } from "../shared/csv.ts";

test("csv quotes commas, quotes and newlines; empty for null", () => {
	const out = toCsv(["a", "b", "c"], [{ a: "x,y", b: 'say "hi"', c: null }, { a: "line\nbreak", b: 3, c: undefined }]);
	assert.equal(out, 'a,b,c\n"x,y","say ""hi""",\n"line\nbreak",3,\n');
});
