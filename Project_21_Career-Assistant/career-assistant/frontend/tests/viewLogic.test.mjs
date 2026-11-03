import test from "node:test";
import assert from "node:assert/strict";
import { togglePageSelection, pageNumbers, date } from "../src/viewLogic.ts";
import { discoveryTask, tasksChanged, taskCompletion } from "../src/viewLogic.ts";
import { profileSnapshot, answerDetails, titleRegions } from "../src/viewLogic.ts";

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

test("old discovery errors do not reappear on login or on another jobs page", () => {
  const tasks = [{id:"old",kind:"discover",module:"domestic",status:"failed",created_at:"2026-10-22T10:00:00"}];
  const openedAt = Date.parse("2026-10-23T10:00:00Z");
  assert.equal(discoveryTask(tasks,"domestic",openedAt), undefined);
  tasks.unshift({id:"new",kind:"discover",module:"visa",status:"failed",created_at:"2026-10-23T10:01:00"});
  assert.equal(discoveryTask(tasks,"domestic",openedAt), undefined);
  assert.equal(discoveryTask(tasks,"visa",openedAt).id,"new");
});

test("discovery still shows a running task after reloading the page", () => {
  const tasks = [{id:"pending",kind:"discover",module:"domestic",status:"running",created_at:"2026-10-22T10:00:00"}];
  assert.equal(discoveryTask(tasks,"domestic",Date.now()).id,"pending");
});

test("polling detects tasks that completed before the first snapshot and new question batches", () => {
  assert.equal(tasksChanged([], [{id:"upload",status:"completed"}]),true);
  assert.equal(tasksChanged([{id:"guide",status:"running",result:{questions:0}}], [{id:"guide",status:"running",result:{questions:3}}]),true);
  assert.equal(tasksChanged([{id:"guide",status:"completed"}], [{id:"guide",status:"completed"}]),false);
});

test("terminal task messages replace upload notices and expose generation failures", () => {
  assert.match(taskCompletion({kind:"ingest",status:"completed"}),/ready to use/);
  assert.equal(taskCompletion({kind:"interview",status:"failed",error:"Claude: HTTP 401"}),"Claude: HTTP 401");
});

test("profile save state compares editable values, detects edits and becomes clean on revert", () => {
  const profile={name:"Alex Example",notice_period:"30 days",approved:true,skills:["Python"]};
  const saved=profileSnapshot(profile,"[]");
  assert.equal(profileSnapshot({...profile,extraction_usage:{tokens:10}},"[]"),saved);
  assert.notEqual(profileSnapshot({...profile,name:"Updated Name"},"[]"),saved);
  assert.notEqual(profileSnapshot({...profile,approved:false},"[]"),saved);
  assert.notEqual(profileSnapshot(profile,'[{"start":"2024-01"}]'),saved);
  assert.equal(profileSnapshot({...profile,name:"Alex Example"},"[]"),saved);
});

test("interview explanations omit removed metadata while retaining real solutions", () => {
  const detail=answerDetails({id:"Q1",difficulty:"Hard",source_classification:"General Preparation",interview_round:"Coding",preparation_note:"Prepare an answer",jd_relevance:"Hidden",resume_relevance:"Hidden",qualitative_likelihood:"Hidden",priority:1,short_answer:"Short",detailed_answer:"Detailed",coding:{solution:"def solve(): return 1"},follow_ups:[{answer:"Actual answer"}]});
  assert.deepEqual(Object.keys(detail),["coding","follow_ups"]);
  assert.equal(detail.coding.solution,"def solve(): return 1");
});


test("title suggestions display region-specific title lists without raw metadata", () => {
  const groups=titleRegions({model:"hidden",usage:{total_tokens:123},disclaimer:"hidden",regions:[{region:"EU",countries:["Germany"],titles:["QA Lead","SDET","QA Lead"]},{region:"India",titles:["Test Manager"]}]},"visa");
  assert.deepEqual(groups,[{region:"EU",titles:["QA Lead","SDET"]},{region:"India",titles:["Test Manager"]}]);
  assert.deepEqual(titleRegions({titles:[{title:"QA Lead",relevance:"hidden"}],model:"hidden"},"domestic"),[{region:"India",titles:["QA Lead"]}]);
});
