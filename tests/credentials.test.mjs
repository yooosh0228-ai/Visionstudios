import assert from "node:assert/strict";
import { test } from "node:test";
import { requireApiKey, toAuthorizationHeader } from "../generation/credentials.ts";

test("the studio key keeps the Key authorization scheme", () => {
  for (const apiKey of ["test_api_key", "test-id:test-secret"]) {
    assert.equal(requireApiKey(`  ${apiKey}\n`), apiKey);
    assert.equal(toAuthorizationHeader(apiKey), `Key ${apiKey}`);
  }
});

test("invalid keys cannot become authorization headers", () => {
  for (const apiKey of ["", "  ", "test key", "test\r\nInjected: value", "test\0key"]) {
    assert.throws(() => toAuthorizationHeader(apiKey), /API key/);
  }
});
