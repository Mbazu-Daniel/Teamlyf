import assert from "node:assert/strict";
import {
  InvalidPayloadError,
  PAYLOAD_LIMITS,
  parsePayloads,
} from "../src/modules/chat/realtime/socket-payloads";

let failures = 0;
function check(name: string, run: () => void) {
  try {
    run();
    console.log(`  ok  ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL  ${name}`);
    console.error(`      ${error instanceof Error ? error.message : String(error)}`);
  }
}

function rejects(name: string, run: () => void) {
  check(name, () => {
    assert.throws(run, InvalidPayloadError);
  });
}

console.log("socket payload limits");

// A well-formed packet survives intact, so validation never blocks real clients.
check("accepts a normal channel message", () => {
  const parsed = parsePayloads.sendChannelMessage({
    channelId: "ch-1",
    content: "hello team",
    attachmentIds: ["att-1"],
  });
  assert.equal(parsed.channelId, "ch-1");
  assert.equal(parsed.content, "hello team");
  assert.deepEqual(parsed.attachmentIds, ["att-1"]);
});

check("keeps content exactly at the limit", () => {
  const content = "x".repeat(PAYLOAD_LIMITS.maxContentLength);
  assert.equal(
    parsePayloads.sendChannelMessage({ channelId: "ch-1", content }).content.length,
    PAYLOAD_LIMITS.maxContentLength,
  );
});

rejects("rejects content past the limit", () => {
  parsePayloads.sendChannelMessage({
    channelId: "ch-1",
    content: "x".repeat(PAYLOAD_LIMITS.maxContentLength + 1),
  });
});

rejects("rejects a multi-megabyte body", () => {
  parsePayloads.sendDirectMessage({ recipientId: "m-1", content: "x".repeat(5_000_000) });
});

rejects("rejects a bare string payload", () => {
  parsePayloads.sendChannelMessage("just a string");
});

rejects("rejects a null payload", () => {
  parsePayloads.joinChannel(null);
});

rejects("rejects an array payload", () => {
  parsePayloads.joinChannel(["ch-1"]);
});

rejects("rejects a non-string channel id", () => {
  parsePayloads.joinChannel({ channelId: { nested: true } });
});

rejects("rejects a missing required id", () => {
  parsePayloads.joinChannel({});
});

rejects("rejects an id past the length cap", () => {
  parsePayloads.joinChannel({ channelId: "c".repeat(PAYLOAD_LIMITS.maxIdLength + 1) });
});

rejects("rejects blank content", () => {
  parsePayloads.sendChannelMessage({ channelId: "ch-1", content: "   " });
});

rejects("rejects an oversized id list", () => {
  parsePayloads.sendChannelMessage({
    channelId: "ch-1",
    content: "hi",
    attachmentIds: Array.from(
      { length: PAYLOAD_LIMITS.maxIdListLength + 1 },
      (_, index) => `att-${index}`,
    ),
  });
});

rejects("rejects a non-array id list", () => {
  parsePayloads.sendChannelMessage({ channelId: "ch-1", content: "hi", attachmentIds: "att-1" });
});

rejects("rejects an unknown message type", () => {
  parsePayloads.deleteMessage({ messageId: "m-1", messageType: "system" });
});

check("accepts the known message types", () => {
  // The app's vocabulary is "channel" / "direct" throughout the chat module;
  // "dm" is not one of them, so the whitelist has to match the real wire value
  // or every reaction and delete on a direct message is rejected.
  assert.equal(
    parsePayloads.deleteMessage({ messageId: "m-1", messageType: "direct" }).messageType,
    "direct",
  );
  assert.equal(
    parsePayloads.deleteMessage({ messageId: "m-1", messageType: "channel" }).messageType,
    "channel",
  );
  assert.equal(
    parsePayloads.reaction({ messageId: "m-1", messageType: "direct" }).messageType,
    "direct",
  );
});

rejects("rejects the dm alias, which is not a wire value", () => {
  parsePayloads.reaction({ messageId: "m-1", messageType: "dm", reaction: "👍" });
});

rejects("rejects an oversized reaction", () => {
  parsePayloads.reaction({
    messageId: "m-1",
    reaction: "x".repeat(PAYLOAD_LIMITS.maxCallTypeLength + 1),
  });
});

rejects("rejects an oversized call reason", () => {
  parsePayloads.callId({
    callId: "call-1",
    reason: "x".repeat(PAYLOAD_LIMITS.maxReasonLength + 1),
  });
});

rejects("rejects a call without an id", () => {
  parsePayloads.callId({});
});

check("typing drops unknown fields instead of forwarding them", () => {
  const parsed = parsePayloads.typing({ channelId: "ch-1", injected: "value" });
  assert.deepEqual(parsed, { channelId: "ch-1", recipientId: undefined });
});

check("a parser never returns a key the client invented", () => {
  const parsed = parsePayloads.initiateCall({
    callType: "video",
    recipientId: "m-1",
    sneaky: "value",
  }) as Record<string, unknown>;
  // The client-invented key is dropped; only the known fields survive, and an
  // absent one reads as undefined rather than arriving as an extra value.
  assert.equal("sneaky" in parsed, false);
  assert.equal(parsed.callType, "video");
  assert.equal(parsed.recipientId, "m-1");
  assert.equal(parsed.participantIds, undefined);
});

rejects("rejects an oversized participant list on a call", () => {
  parsePayloads.initiateCall({
    recipientId: "m-1",
    participantIds: Array.from(
      { length: PAYLOAD_LIMITS.maxIdListLength + 1 },
      (_, index) => `m-${index}`,
    ),
  });
});

if (failures > 0) {
  console.error(`\n${failures} socket payload check(s) failed`);
  process.exit(1);
}
console.log("\nall socket payload checks passed");
