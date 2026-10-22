import test from "node:test";
import assert from "node:assert/strict";
import { api } from "../src/api.ts";

test("plain Vercel 404 explains that the backend API is unavailable", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response("The page could not be found", { status: 404 });
  try {
    await assert.rejects(
      api("/auth/register", "POST", {
        email: "person@example.com",
        username: "person",
        password: "not-a-real-password",
      }),
      /API is unavailable on this deployment/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("JSON API error details are preserved", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({ detail: "Email is already registered." }, { status: 409 });
  try {
    await assert.rejects(
      api("/auth/register", "POST", {}),
      /Email is already registered/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
