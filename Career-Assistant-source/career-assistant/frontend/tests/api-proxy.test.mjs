import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/[...path].js";

function responseRecorder() {
  return {
    headers: {},
    statusCode: 200,
    body: undefined,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    end(body) {
      this.body = body;
    },
  };
}

test("proxy explains how to configure the backend when no URL is set", async () => {
  const previous = process.env.CAREER_API_URL;
  delete process.env.CAREER_API_URL;
  const res = responseRecorder();
  try {
    await handler({ method: "POST" }, res);
    assert.equal(res.statusCode, 503);
    assert.match(res.body.toString(), /Set CAREER_API_URL in Vercel/);
  } finally {
    if (previous === undefined) delete process.env.CAREER_API_URL;
    else process.env.CAREER_API_URL = previous;
  }
});

test("proxy forwards auth request cookies, CSRF, origin and JSON body", async () => {
  const originalFetch = globalThis.fetch;
  const previous = process.env.CAREER_API_URL;
  process.env.CAREER_API_URL = "https://career-api.example";
  let target;
  let forwarded;
  globalThis.fetch = async (url, options) => {
    target = url.toString();
    forwarded = options;
    return Response.json(
      { message: "Registration successful." },
      {
        status: 201,
        headers: { "set-cookie": "career_session=session-token; HttpOnly" },
      },
    );
  };
  const res = responseRecorder();
  try {
    await handler(
      {
        method: "POST",
        url: "/api/auth/register",
        headers: {
          "content-type": "application/json",
          cookie: "career_session=example",
          origin: "https://jobsearchandtracker.vercel.app",
          "x-csrf-token": "csrf-example",
        },
        body: { email: "person@example.com", username: "person" },
      },
      res,
    );
    assert.equal(target, "https://career-api.example/api/auth/register");
    assert.equal(forwarded.headers.get("cookie"), "career_session=example");
    assert.equal(
      forwarded.headers.get("origin"),
      "https://jobsearchandtracker.vercel.app",
    );
    assert.equal(forwarded.headers.get("x-csrf-token"), "csrf-example");
    assert.deepEqual(JSON.parse(forwarded.body), {
      email: "person@example.com",
      username: "person",
    });
    assert.equal(res.statusCode, 201);
    assert.match(res.headers["set-cookie"][0], /career_session=session-token/);
    assert.match(res.body.toString(), /Registration successful/);
  } finally {
    globalThis.fetch = originalFetch;
    if (previous === undefined) delete process.env.CAREER_API_URL;
    else process.env.CAREER_API_URL = previous;
  }
});
