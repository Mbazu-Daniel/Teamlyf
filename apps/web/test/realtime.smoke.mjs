// Isolated local API only. No external providers or production data.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { io } from "socket.io-client";
const origin = process.env.PARITY_API_URL;
if (origin !== "http://localhost:3199") throw new Error("Use the disposable test API on localhost:3199.");
const base = origin + "/api/v1";
const stamp = Date.now();
const failures = [];
let modelMode = "update", modelRequests = 0;
// Deterministic local model double; this never contacts a paid AI service.
const model = createServer(async (request, response) => {
  let body = "";
  for await (const chunk of request) body += chunk;
  const input = JSON.parse(body);
  modelRequests++;
  if (modelMode === "slow") await new Promise((resolve) => setTimeout(resolve, 1500));
  const done = input.messages.some((message) => message.role === "tool");
  const message = done || modelMode === "slow"
    ? { role: "assistant", content: "Local test completed" }
    : { role: "assistant", tool_calls: [{ id: "local-tool-1", function: { name: "update_task", arguments: JSON.stringify({ name: "Agent updated task", ...(modelMode === "invalid" ? { priority: "invalid" } : {}) }) } }] };
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ choices: [{ message }] }));
});
await new Promise((resolve, reject) => { model.once("error", reject); model.listen(3197, "127.0.0.1", resolve); });
model.unref();
let checks = 0;
async function check(name, run) {
  try { await run(); checks++; console.log(`PASS ${name}`); }
  catch (error) { failures.push(name); console.error(`FAIL ${name}: ${error.message}`); }
}
function actor(name) {
  const cookies = new Map();
  const cookie = () => [...cookies].map(([k, v]) => `${k}=${v}`).join("; ");
  return { name, email: `e2e-${name}-${stamp}@example.test`, cookie, async request(path, method = "GET", body, status) {
    const response = await fetch(base + path, { method, headers: { "Content-Type": "application/json", Origin: "http://localhost:3198", Cookie: cookie() }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(15000) });
    for (const item of response.headers.getSetCookie()) { const [first] = item.split(";"); const i = first.indexOf("="); cookies.set(first.slice(0, i), first.slice(i + 1)); }
    const data = await response.json();
    if (status) assert.equal(response.status, status, JSON.stringify(data)); else assert.ok(response.ok, `${response.status} ${JSON.stringify(data)}`);
    return data;
  }};
}
const owner = actor("owner"), peer = actor("peer"), observer = actor("observer"), outside = actor("outside");
for (const person of [owner, peer, observer, outside]) await person.request("/auth/sign-up/email", "POST", { name: `E2E ${person.name}`, email: person.email, password: "E2E-local-test-only-2026!" });
const workspace = await owner.request("/organization", "POST", { name: "E2E verification", slug: `e2e-${stamp}` });
const org = workspace.id ?? workspace.organization?.id;
assert.ok(org);
const root = `/organization/${org}`;
for (const person of [peer, observer]) {
  const invite = await owner.request(root + "/invitations", "POST", { email: person.email, role: "member" });
  await person.request(root + "/invitations/accept", "POST", { invitationId: invite.id });
}
const members = (await owner.request(root + "/members")).members;
for (const person of [owner, peer, observer]) person.id = members.find((m) => m.user.email === person.email).id;
const sockets = [];
async function connect(person, expectedFailure = false) {
  const socket = io(`${origin}/organization/${org}/chat`, { transports: ["websocket"], extraHeaders: { Cookie: person.cookie(), Origin: "http://localhost:3198" }, reconnection: false, forceNew: true, timeout: 5000 });
  sockets.push(socket);
  await new Promise((resolve, reject) => { socket.once("connect", () => expectedFailure ? reject(new Error("Unauthorized socket connected")) : resolve()); socket.once("connect_error", (error) => expectedFailure ? resolve() : reject(error)); });
  return socket;
}
const ack = (socket, event, body) => socket.timeout(5000).emitWithAck(event, body);
function event(socket, name, match = () => true, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.off(name, receive); reject(new Error(`Missing ${name}`)); }, timeout);
    function receive(data) { if (match(data)) { clearTimeout(timer); socket.off(name, receive); resolve(data); } }
    socket.on(name, receive);
  });
}
async function waitForRun(agentId, runId) {
  let run;
  for (let attempt = 0; attempt < 30; attempt++) {
    run = (await owner.request(root + `/agents/${agentId}/runs`)).find((item) => item.id === runId);
    if (["completed", "failed", "cancelled"].includes(run?.status)) return run;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Run did not finish: ${run?.status}`);
}
try {
  await check("reject a non-member socket", () => connect(outside, true));
  const ownerSocket = await connect(owner), peerSocket = await connect(peer), observerSocket = await connect(observer);
  const channel = await owner.request(root + "/channels", "POST", { name: `e2e-${stamp}`, description: "Test channel" });
  const channelId = channel.id;
  await peer.request(root + `/channels/${channelId}/join`, "POST");
  await ack(ownerSocket, "join-channel", { channelId }); await ack(peerSocket, "join-channel", { channelId });
  let message;
  await check("channel message delivered live and persisted", async () => {
    const received = event(peerSocket, "new-channel-message");
    const sent = await ack(ownerSocket, "send-channel-message", { channelId, content: "E2E channel message" });
    assert.equal(sent.success, true); message = sent.message;
    assert.equal((await received).message.id, message.id);
    const history = await peer.request(root + `/channels/${channelId}/messages`);
    assert.ok(JSON.stringify(history).includes(message.id));
  });
  await check("thread reply delivered and persisted", async () => {
    const received = event(ownerSocket, "new-channel-message");
    const reply = await ack(peerSocket, "send-channel-message", { channelId, content: "E2E thread reply", parentMessageId: message.id });
    assert.equal(reply.success, true); await received;
    assert.ok(JSON.stringify(await owner.request(root + `/channels/${channelId}/messages/threads/${message.id}`)).includes(reply.message.id));
  });
  await check("typing indicators reach another channel member", async () => { const received = event(peerSocket, "user-typing", (data) => data.typingUsers?.length > 0); await ack(ownerSocket, "typing-start", { channelId }); await received; await ack(ownerSocket, "typing-stop", { channelId }); });
  await check("channel reactions update live and persist", async () => {
    const received = event(ownerSocket, "reaction-added");
    assert.equal((await ack(peerSocket, "add-reaction", { messageId: message.id, messageType: "channel", reaction: "👍" })).success, true); await received;
    assert.equal((await owner.request(root + `/message-reactions/by-message?messageId=${message.id}&messageType=channel`)).length, 1);
  });
  let dm;
  await check("direct message delivered live and persisted", async () => {
    const received = event(peerSocket, "new-direct-message");
    const sent = await ack(ownerSocket, "send-direct-message", { recipientId: peer.id, content: "E2E private message" });
    assert.equal(sent.success, true); dm = sent.message; assert.equal((await received).message.id, dm.id);
    assert.ok(JSON.stringify(await peer.request(root + `/direct-messages/conversations/${owner.id}`)).includes(dm.id));
  });
  await check("DM thread reply and read state", async () => {
    const sent = await ack(peerSocket, "send-direct-message", { recipientId: owner.id, content: "Private reply", parentMessageId: dm.id }); assert.equal(sent.success, true);
    assert.ok(JSON.stringify(await owner.request(root + `/direct-messages/conversations/${peer.id}/threads/${dm.id}`)).includes(sent.message.id));
    await peer.request(root + `/direct-messages/conversations/${owner.id}/read`, "POST");
  });
  await check("third member cannot react to another pair's DM", async () => { const reply = await ack(observerSocket, "add-reaction", { messageId: dm.id, messageType: "direct", reaction: "👀" }); assert.equal(reply.success, false); });
  await check("DM mentions persist for the intended participant", async () => {
    await owner.request(root + "/message-mentions", "POST", { messageId: dm.id, messageType: "direct", mentionedUserId: peer.id });
    assert.ok(JSON.stringify(await peer.request(root + `/message-mentions/by-member/${peer.id}`)).includes(dm.id));
  });
  await check("third member cannot read a private mention inbox", () => observer.request(root + `/message-mentions/by-member/${peer.id}`, "GET", undefined, 403));
  await check("third member cannot use mentions to read a private DM", () => observer.request(root + "/message-mentions", "POST", { messageId: dm.id, messageType: "direct", mentionedUserId: observer.id }, 403));
  await check("third member cannot read another pair's DM reactions", () => observer.request(root + `/message-reactions/by-message?messageId=${dm.id}&messageType=direct`, "GET", undefined, 403));
  await check("non-channel member cannot react to channel message", async () => { assert.equal((await ack(observerSocket, "add-reaction", { messageId: message.id, messageType: "channel", reaction: "👀" })).success, false); });
  await check("non-channel member cannot broadcast typing", async () => { const result = await ack(observerSocket, "typing-start", { channelId }); assert.ok(result.error); });
  await check("only message sender can delete", async () => { assert.equal((await ack(peerSocket, "delete-message", { messageId: message.id, messageType: "channel" })).success, false); });
  await check("leaving stops live channel delivery", async () => {
    await peer.request(root + `/channels/${channelId}/leave`, "POST");
    const received = event(peerSocket, "new-channel-message", () => true, 700).then(() => true, () => false);
    await ack(ownerSocket, "send-channel-message", { channelId, content: "After leave" }); assert.equal(await received, false);
  });
  await check("read-only role cannot send over existing socket", async () => {
    await owner.request(root + "/roles", "POST", { role: "chat-reader", permission: { chat: ["read"] } });
    await owner.request(root + "/members/update-role", "POST", { memberId: peer.id, role: ["chat-reader"] });
    const sent = await ack(peerSocket, "send-direct-message", { recipientId: owner.id, content: "Should be blocked" }); assert.equal(sent.success, false);
  });
  await owner.request(root + "/members/update-role", "POST", { memberId: peer.id, role: ["member"] });
  await check("call signalling, decline and history persist without media provider", async () => {
    const incoming = event(peerSocket, "call-initiated");
    const started = await ack(ownerSocket, "initiate-call", { recipientId: peer.id, callType: "voice" });
    assert.equal(started.success, true); assert.equal((await incoming).callId, started.callSession.id);
    assert.equal((await ack(observerSocket, "accept-call", { callId: started.callSession.id })).success, false);
    const unavailable = await ack(peerSocket, "accept-call", { callId: started.callSession.id });
    assert.equal(unavailable.success, false); assert.match(unavailable.error, /LiveKit is not configured/);
    const history = await owner.request(root + "/calls/history");
    assert.ok(!JSON.stringify(history).includes('"status":"JOINED"'));
    const rejected = event(ownerSocket, "call-rejected");
    assert.equal((await ack(peerSocket, "reject-call", { callId: started.callSession.id })).success, true); await rejected;
    assert.ok(JSON.stringify(await owner.request(root + "/calls/history")).includes(started.callSession.id));
  });
  await check("missing LiveKit returns a useful error", async () => {
    const response = await owner.request(root + "/calls/token", "POST", { roomName: "e2e-unconfigured-room" }, 400);
    assert.match(JSON.stringify(response), /LiveKit is not configured/);
  });
  await check("chat attachment upload and message download", async () => {
    const bytes = "E2E attachment";
    const upload = await owner.request(root + "/attachments/initiate", "POST", { fileName: "e2e.txt", mimeType: "text/plain", fileSize: Buffer.byteLength(bytes), conversationId: peer.id });
    assert.ok((await fetch(base + upload.uploadUrl, { method: "PUT", body: bytes, headers: { "Content-Type": "text/plain" } })).ok);
    const sent = await ack(ownerSocket, "send-direct-message", { recipientId: peer.id, content: "Attached test file", attachmentIds: [upload.attachmentId] });
    assert.equal(sent.success, true); assert.equal(sent.message.attachments.length, 1);
    const url = sent.message.attachments[0].url;
    assert.equal(await (await fetch(url.startsWith("http") ? url : base + url)).text(), bytes);
  });
  await check("agent creation/update and unavailable provider handled", async () => {
    const agent = await owner.request(root + "/agents", "POST", { name: "E2E agent" });
    await owner.request(root + `/agents/${agent.id}`, "PATCH", { name: "Updated E2E agent", enabled: false });
    assert.ok((await owner.request(root + "/agents")).some((row) => row.id === agent.id && row.enabled === false));
    await owner.request(root + `/agents/${agent.id}/runs`, "POST", { input: {} }, 403);
    await owner.request(root + `/agents/${agent.id}`, "PATCH", { enabled: true });
    const project = await owner.request(root + "/projects", "POST", { name: "Agent test", identifier: "AGT" });
    const statuses = await owner.request(root + `/projects/${project.id}/statuses`);
    const task = await owner.request(root + `/projects/${project.id}/tasks`, "POST", { name: "Agent test task", statusId: statuses[0].id });
    const run = await owner.request(root + `/agents/${agent.id}/runs`, "POST", { input: { projectId: project.id, taskId: task.id } });
    const finished = await waitForRun(agent.id, run.id);
    assert.equal(finished?.status, "failed"); assert.match(finished.errorMessage, /provider.*configured/i);
    await outside.request(root + "/agents", "GET", undefined, 403);
    await owner.request(root + "/agents/provider-configs", "POST", { provider: "openai", model: "local-test-double", source: "managed" });
    const start = () => owner.request(root + `/agents/${agent.id}/runs`, "POST", { input: { projectId: project.id, taskId: task.id } });
    await check("agent without tool grants cannot access task through model", async () => {
      const denied = await waitForRun(agent.id, (await start()).id);
      assert.equal(denied.status, "failed"); assert.match(denied.errorMessage, /tool grant/); assert.equal(modelRequests, 0);
    });
    await owner.request(root + "/permission-grants", "POST", { subjectKind: "agent", subjectId: agent.id, module: "pm", action: "read", resourceId: task.id });
    await check("read-only agent cannot mutate a task", async () => {
      const denied = await waitForRun(agent.id, (await start()).id);
      assert.equal(denied.status, "failed"); assert.match(denied.errorMessage, /pm:update/);
    });
    await owner.request(root + "/permission-grants", "POST", { subjectKind: "agent", subjectId: agent.id, module: "pm", action: "update", resourceId: task.id });
    await check("agent completes validated task tool with local model double", async () => {
      const completed = await waitForRun(agent.id, (await start()).id);
      assert.equal(completed.status, "completed"); assert.equal(completed.output.summary, "Local test completed");
      const persisted = await owner.request(root + `/projects/${project.id}/tasks/${task.id}`);
      assert.equal(persisted.name, "Agent updated task");
    });
    await check("agent tool rejects invalid task fields", async () => {
      modelMode = "invalid";
      const invalid = await waitForRun(agent.id, (await start()).id);
      assert.equal(invalid.status, "failed"); assert.match(invalid.errorMessage, /invalid task fields/);
    });
    await check("cancelling running agent remains cancelled after model response", async () => {
      modelMode = "slow";
      const previousRequests = modelRequests;
      const running = await start();
      for (let attempt = 0; attempt < 20 && previousRequests === modelRequests; attempt++) await new Promise((resolve) => setTimeout(resolve, 100));
      assert.ok(modelRequests > previousRequests);
      await owner.request(root + `/agents/${agent.id}/runs/${running.id}/cancel`, "POST");
      await new Promise((resolve) => setTimeout(resolve, 1800));
      assert.equal((await waitForRun(agent.id, running.id)).status, "cancelled");
    });
  });
  await check("billing reports unavailable checkout without provider", async () => { const summary = await owner.request(root + "/billing"); assert.equal(summary.checkoutAvailable, false); });
  console.log(JSON.stringify({ workspace: `e2e-${stamp}`, ownerEmail: owner.email, peerEmail: peer.email }));
} finally { for (const socket of sockets) socket.disconnect(); model.closeAllConnections(); model.close(); }
console.log(`${checks} passed; ${failures.length} failed`);
if (failures.length) process.exitCode = 1;
