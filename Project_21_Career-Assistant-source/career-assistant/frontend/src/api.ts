let csrf = "";
export const API = "";
export function setCsrf(value: string) {
  csrf = value;
}

export async function responsePayload(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    if (res.status === 404 || res.status === 503) {
      return {
        detail:
          "The Career Assistant API is unavailable on this deployment. Account and career features need a connected backend.",
      };
    }
    return {
      detail: `The server returned an invalid response (HTTP ${res.status}).`,
    };
  }
}

export async function api(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<any> {
  const form = body instanceof FormData;
  const res = await fetch(API + "/api" + path, {
    method,
    credentials: "include",
    headers: {
      ...(!form && body ? { "Content-Type": "application/json" } : {}),
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
    },
    body:
      body === undefined
        ? undefined
        : form
          ? (body as FormData)
          : JSON.stringify(body),
  });
  const payload = await responsePayload(res);
  if (!res.ok)
    throw new Error(
      typeof payload.detail === "string"
        ? payload.detail
        : res.status === 422
          ? "Check the required fields and input lengths."
          : "Request failed. Please try again.",
    );
  return payload;
}
export async function downloadContent(id: string, format: string) {
  const result = await api(
    "/content/" + id + "/render?format=" + format,
    "POST",
  );
  const res = await fetch(API + result.url, { credentials: "include" });
  if (!res.ok)
    throw new Error("Download unavailable. Regenerate the file and try again.");
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = "Career-Assistant-" + id.slice(0, 8) + "." + format;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export const statuses = [
  "NOT APPLIED",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "WAITING FOR OFFER",
  "SELECTED",
  "REJECTED",
];
