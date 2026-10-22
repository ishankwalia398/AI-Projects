const forwardedHeaders = [
  "accept",
  "content-type",
  "cookie",
  "origin",
  "user-agent",
  "x-csrf-token",
];

function json(res, status, detail) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify({ detail }));
}

async function requestBody(req) {
  if (["GET", "HEAD"].includes(req.method)) return undefined;
  if (req.body !== undefined) {
    if (typeof req.body === "string" || Buffer.isBuffer(req.body)) {
      return req.body;
    }
    if (req.body instanceof Uint8Array) return Buffer.from(req.body);
    return JSON.stringify(req.body);
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const backend = process.env.CAREER_API_URL;
  if (!backend) {
    json(
      res,
      503,
      "The Career Assistant backend is not configured. Set CAREER_API_URL in Vercel project environment variables.",
    );
    return;
  }

  let backendOrigin;
  try {
    backendOrigin = new URL(backend);
    if (
      backendOrigin.protocol !== "https:" &&
      !["localhost", "127.0.0.1"].includes(backendOrigin.hostname)
    ) {
      throw new Error("Backend URL must use HTTPS.");
    }
    if (backendOrigin.username || backendOrigin.password) {
      throw new Error("Backend URL must not contain credentials.");
    }
  } catch {
    json(res, 500, "CAREER_API_URL must be a valid HTTPS backend URL.");
    return;
  }

  try {
    const target = new URL(req.url || "/api", backendOrigin.origin);
    if (target.origin !== backendOrigin.origin || !target.pathname.startsWith("/api/")) {
      json(res, 400, "Only Career Assistant API paths can be proxied.");
      return;
    }
    const headers = new Headers();
    for (const name of forwardedHeaders) {
      const value = req.headers[name];
      if (value) headers.set(name, value);
    }

    const response = await fetch(target, {
      method: req.method,
      headers,
      body: await requestBody(req),
      redirect: "manual",
    });

    res.statusCode = response.status;
    for (const name of ["content-type", "cache-control", "location"]) {
      const value = response.headers.get(name);
      if (value) res.setHeader(name, value);
    }
    const cookies = response.headers.getSetCookie?.() ?? [];
    if (cookies.length) {
      res.setHeader("Set-Cookie", cookies);
    } else {
      const cookie = response.headers.get("set-cookie");
      if (cookie) res.setHeader("Set-Cookie", cookie);
    }
    res.end(
      req.method === "HEAD" ||
        [204, 304].includes(response.status)
        ? undefined
        : Buffer.from(await response.arrayBuffer()),
    );
  } catch (error) {
    console.error(
      "Career Assistant backend proxy request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    json(
      res,
      502,
      "The Career Assistant backend could not be reached. Check CAREER_API_URL and the backend health endpoint.",
    );
  }
}
