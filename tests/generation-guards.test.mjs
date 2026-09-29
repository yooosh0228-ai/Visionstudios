import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

// Match the extensionless TypeScript imports accepted by Next.js.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (error.code !== "ERR_MODULE_NOT_FOUND" || !specifier.startsWith(".")) throw error;
      return nextResolve(`${specifier}.ts`, context);
    }
  },
});

const { describeFailure, isRetryable } = await import("../generation/errors.ts");
const { createSubmissionGuard, isSubmissionId } = await import("../generation/submissions.ts");
const { MissingCredentialsError } = await import("../generation/credentials.ts");
const { PlatformError, createPlatformClient } = await import("../generation/platform.ts");

test("failures map to actionable codes without leaking the key", () => {
  assert.equal(describeFailure(new MissingCredentialsError()).code, "missing_key");
  assert.equal(describeFailure(new PlatformError(401, { detail: "bad" })).code, "invalid_key");
  assert.equal(describeFailure(new PlatformError(403, null)).code, "invalid_key");
  assert.equal(describeFailure(new PlatformError(429, null)).code, "rate_limited");
  assert.equal(describeFailure(new PlatformError(404, null), "status").code, "not_found");
  assert.equal(describeFailure(new PlatformError(500, null)).code, "platform");
  assert.equal(describeFailure(new Error("Pick a duration")).message, "Pick a duration");
});

test("validation detail lists are turned into readable messages", () => {
  const failure = describeFailure(
    new PlatformError(422, { detail: [{ loc: ["body", "duration"], msg: "must be <= 15" }] })
  );
  assert.equal(failure.code, "invalid_input");
  assert.equal(failure.message, "duration: must be <= 15");
});

test("a submit that times out is reported as unconfirmed, never as a failure to retry", () => {
  const timeout = new DOMException("The operation timed out.", "TimeoutError");
  assert.equal(describeFailure(timeout, "submit").code, "unconfirmed");
  assert.equal(describeFailure(new TypeError("fetch failed"), "submit").code, "unconfirmed");
  assert.equal(describeFailure(new TypeError("fetch failed"), "status").code, "platform");
});

test("only terminal answers stop a poll", () => {
  for (const code of ["missing_key", "invalid_key", "rate_limited", "platform", "unconfirmed"])
    assert.equal(isRetryable(code), true, code);
  for (const code of ["not_found", "invalid_input"]) assert.equal(isRetryable(code), false, code);
});

test("a repeated submission id reuses the first submit instead of paying twice", async () => {
  let clock = 0;
  const guard = createSubmissionGuard(() => clock);
  let calls = 0;
  const submit = async () => ({ n: ++calls });
  const id = "0f8b4c1e-8c7d-4f5a-9d1e-2b3c4d5e6f70";
  const [a, b] = await Promise.all([guard.run("key-a", id, submit), guard.run("key-a", id, submit)]);
  assert.equal(calls, 1);
  assert.deepEqual(a, b);
  // Another key never sees this key's result.
  await guard.run("key-b", id, submit);
  assert.equal(calls, 2);
  // Entries expire.
  clock += 11 * 60_000;
  await guard.run("key-a", id, submit);
  assert.equal(calls, 3);
  assert.equal(isSubmissionId(id), true);
  for (const bad of ["", "short", 42, null, "has spaces in it here!"]) assert.equal(isSubmissionId(bad), false);
});

test("platform requests use the Key scheme with the complete key and a timeout", async () => {
  let seen;
  const client = createPlatformClient({
    apiKey: "id:secret",
    baseUrl: "https://api.higgsfield.ai/",
    fetch: async (url, init) => {
      seen = { url, init };
      return new Response(JSON.stringify({ request_id: "r1", status_url: "s", cancel_url: "c" }));
    },
  });
  const queued = await client.submit("bytedance/seedance-2.5/text-to-video", { prompt: "x" });
  assert.equal(queued.requestId, "r1");
  assert.equal(seen.url, "https://api.higgsfield.ai/bytedance/seedance-2.5/text-to-video");
  assert.equal(seen.init.headers.Authorization, "Key id:secret");
  assert.equal(seen.init.headers["Content-Type"], "application/json");
  assert.ok(seen.init.signal instanceof AbortSignal);
});

test("cancel reaches the platform cancel endpoint", async () => {
  let seen;
  const client = createPlatformClient({
    apiKey: "k",
    baseUrl: "https://api.higgsfield.ai",
    fetch: async (url, init) => {
      seen = { url, method: init.method };
      return new Response(null, { status: 202 });
    },
  });
  await client.cancel("abc");
  assert.deepEqual(seen, { url: "https://api.higgsfield.ai/requests/abc/cancel", method: "POST" });
});
