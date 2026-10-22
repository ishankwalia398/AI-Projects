import test from "node:test";
import assert from "node:assert/strict";
import { togglePageSelection, pageNumbers, date } from "../src/viewLogic.ts";

test("selecting a page retains selections on other pages without duplicates", () => {
  assert.deepEqual(
    togglePageSelection(["old", "same"], ["same", "new"], true),
    ["old", "same", "new"],
  );
});
test("deselecting a page preserves the selections on other pages", () => {
  assert.deepEqual(
    togglePageSelection(["old", "same", "new"], ["same", "new"], false),
    ["old"],
  );
});
test("page selection never mutates previous state", () => {
  const previous = ["a"];
  togglePageSelection(previous, ["b"], true);
  assert.deepEqual(previous, ["a"]);
});
test("pagination keeps valid first, middle and last page windows", () => {
  assert.deepEqual(pageNumbers(10, 1), [1, 2, 3, 4, 5]);
  assert.deepEqual(pageNumbers(10, 5), [3, 4, 5, 6, 7]);
  assert.deepEqual(pageNumbers(10, 10), [6, 7, 8, 9, 10]);
});
test("empty and short result sets have only valid unique page buttons", () => {
  assert.deepEqual(pageNumbers(0, 1), [1]);
  assert.deepEqual(pageNumbers(2, 2), [1, 2]);
});
test("missing and invalid dates display an empty value", () => {
  assert.equal(date(""), "—");
  assert.equal(date("bad-value"), "—");
});
test("equivalent UTC, naive UTC and offset timestamps render the same date", () => {
  assert.equal(date("2026-10-21T10:00:00"), date("2026-10-21T10:00:00Z"));
  assert.equal(date("2026-10-21T10:00:00Z"), date("2026-10-21T15:30:00+05:30"));
});
