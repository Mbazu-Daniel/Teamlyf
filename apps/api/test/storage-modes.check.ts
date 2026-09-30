// Covers both storage key modes and the public-URL encoding.
import assert from "node:assert/strict";
import { R2StorageService } from "../src/common/storage/r2-storage.service";
import { resolveObjectKey, stripKeyPrefix } from "../src/common/storage/storage.types";
import type { ApiEnv } from "../src/common/config/env";

const BASE_ENV = {
  R2_ACCOUNT_ID: "acct",
  R2_BUCKET_NAME: "bucket",
  R2_ACCESS_KEY_ID: "key",
  R2_SECRET_ACCESS_KEY: "secret",
  STORAGE_URL_TTL_SECONDS: 3600,
  R2_CUSTOM_DOMAIN: "https://cdn.example.com",
};

function service(extra: Record<string, string | undefined> = {}) {
  const env = { ...BASE_ENV, ...extra } as unknown as ApiEnv;
  return new R2StorageService(env);
}

const failures: string[] = [];
function check(name: string, run: () => void) {
  try {
    run();
    console.log(`  ok  ${name}`);
  } catch (error) {
    failures.push(name);
    console.error(`FAIL  ${name}`);
    console.error(`      ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log("storage key modes");

check("full mode returns the key unchanged", () => {
  assert.equal(
    resolveObjectKey({
      key: "org-1/chat/dm/dm-2/file.png",
      organizationId: "org-1",
      location: "chat",
      scope: ["dm", "dm-2"],
    }),
    "org-1/chat/dm/dm-2/file.png",
  );
});

check("leaf mode rebuilds the prefix from the stored value", () => {
  assert.equal(
    resolveObjectKey({
      key: "file.png",
      mode: "leaf",
      organizationId: "org-1",
      location: "chat",
      scope: ["dm", "dm-2"],
    }),
    "org-1/chat/dm/dm-2/file.png",
  );
});

check("leaf mode tolerates a stored value that still carries the prefix", () => {
  assert.equal(
    resolveObjectKey({
      key: "org-1/chat/file.png",
      mode: "leaf",
      organizationId: "org-1",
      location: "chat",
    }),
    "org-1/chat/file.png",
  );
});

check("stripKeyPrefix leaves an unrelated prefix alone", () => {
  assert.equal(stripKeyPrefix("org-2/chat/a.png", "org-1/chat"), "org-2/chat/a.png");
});

check("leaf mode refuses an empty stored value", () => {
  assert.throws(() =>
    resolveObjectKey({ key: "", mode: "leaf", organizationId: "org-1", location: "chat" }),
  );
});

check("leaf mode still rejects a traversal in the prefix", () => {
  assert.throws(() =>
    resolveObjectKey({ key: "a.png", mode: "leaf", organizationId: "../other", location: "chat" }),
  );
});

check("public url encodes spaces and reserved characters per segment", () => {
  assert.equal(
    service().publicUrl("org-1/chat/my report (v2).png"),
    "https://cdn.example.com/org-1/chat/my%20report%20(v2).png",
  );
});

check("a fragment in a file name cannot truncate the url", () => {
  const url = service().publicUrl("org-1/chat/a#b.png");
  assert.equal(url, "https://cdn.example.com/org-1/chat/a%23b.png");
});

check("path separators survive encoding", () => {
  assert.equal(
    service().publicUrl("org-1/chat/dm/dm-2/a.png"),
    "https://cdn.example.com/org-1/chat/dm/dm-2/a.png",
  );
});

check("no public base yields null so reads fall back to a signed url", () => {
  assert.equal(service({ R2_CUSTOM_DOMAIN: "" }).publicUrl("org-1/chat/a.png"), null);
});

if (failures.length > 0) {
  console.error(`\n${failures.length} storage mode check(s) failed`);
  process.exit(1);
}
console.log("\nall storage mode checks passed");
