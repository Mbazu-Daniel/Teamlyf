import type { AgentMessage, AgentModel, AgentModelStreamEvent, AgentToolCall } from "./contracts";
import type { AgentToolDefinition } from "./tool-definitions";

type OpenAIChatModelOptions = {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  systemPrompt?: string;
  signal?: AbortSignal;
};

type ChatMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | {
      role: "assistant";
      content: null;
      tool_calls: Array<{
        id: string;
        type: "function";
        function: { name: string; arguments: string };
      }>;
    }
  | { role: "tool"; tool_call_id: string; content: string };

type ToolAccumulator = {
  id: string;
  name: string;
  arguments: string;
};

export class OpenAIChatModel implements AgentModel {
  private readonly options: Required<Pick<OpenAIChatModelOptions, "apiKey" | "model" | "baseUrl">> &
    Pick<OpenAIChatModelOptions, "systemPrompt" | "signal">;

  constructor(options: OpenAIChatModelOptions) {
    this.options = {
      apiKey: options.apiKey,
      model: options.model ?? "gpt-5.6-luna",
      baseUrl: (options.baseUrl ?? "https://api.openai.com/v1").replace(/\/+$/, ""),
      systemPrompt: options.systemPrompt,
      signal: options.signal,
    };
  }

  async *stream(
    messages: readonly AgentMessage[],
    tools: readonly AgentToolDefinition[],
  ): AsyncIterable<AgentModelStreamEvent> {
    const input: ChatMessage[] = [];
    if (this.options.systemPrompt) input.push({ role: "system", content: this.options.systemPrompt });
    input.push(...this.toChatMessages(messages));

    const response = await fetch(`${this.options.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.options.model,
        messages: input,
        tools: tools.map((tool) => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        })),
        stream: true,
      }),
      signal: this.options.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI request failed (${response.status}): ${body.slice(0, 2000)}`);
    }
    if (!response.body) throw new Error("OpenAI response did not include a stream.");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const accumulators = new Map<number, ToolAccumulator>();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const data = line.startsWith("data:") ? line.slice(5).trim() : "";
          if (!data || data === "[DONE]") continue;

          const parsed = JSON.parse(data) as {
            choices?: Array<{
              delta?: {
                content?: string | null;
                tool_calls?: Array<{
                  index: number;
                  id?: string;
                  function?: { name?: string; arguments?: string };
                }>;
              };
            }>;
          };
          const delta = parsed.choices?.[0]?.delta;
          if (!delta) continue;

          if (delta.content) yield { type: "text", text: delta.content };

          for (const call of delta.tool_calls ?? []) {
            const current = accumulators.get(call.index) ?? {
              id: call.id ?? "",
              name: "",
              arguments: "",
            };
            if (call.id) current.id = call.id;
            if (call.function?.name) current.name += call.function.name;
            if (call.function?.arguments) current.arguments += call.function.arguments;
            accumulators.set(call.index, current);
          }
        }
      }

      buffer += decoder.decode();
      const finalLine = buffer.startsWith("data:") ? buffer.slice(5).trim() : "";
      if (finalLine && finalLine !== "[DONE]") {
        const parsed = JSON.parse(finalLine) as {
          choices?: Array<{ delta?: { content?: string | null } }>;
        };
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) yield { type: "text", text: content };
      }
    } finally {
      reader.releaseLock();
    }

    for (const current of accumulators.values()) {
      if (!current.id || !current.name) throw new Error("OpenAI returned an incomplete tool call.");

      let args: Record<string, unknown>;
      try {
        const parsed = JSON.parse(current.arguments || "{}") as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("tool arguments must be a JSON object");
        }
        args = parsed as Record<string, unknown>;
      } catch (error) {
        throw new Error(
          `Invalid arguments for tool ${current.name}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      yield {
        type: "tool_call",
        toolCall: { id: current.id, name: current.name as AgentToolCall["name"], arguments: args },
      };
    }
  }

  private toChatMessages(messages: readonly AgentMessage[]): ChatMessage[] {
    const result: ChatMessage[] = [];
    let pendingToolCalls: Extract<ChatMessage, { role: "assistant"; tool_calls: unknown }>["tool_calls"] = [];

    const flushToolCalls = (): void => {
      if (!pendingToolCalls.length) return;
      result.push({ role: "assistant", content: null, tool_calls: pendingToolCalls });
      pendingToolCalls = [];
    };

    for (const message of messages) {
      if (message.role === "assistant_tool_call") {
        pendingToolCalls.push({
          id: message.toolCall.id,
          type: "function",
          function: {
            name: message.toolCall.name,
            arguments: JSON.stringify(message.toolCall.arguments),
          },
        });
        continue;
      }

      flushToolCalls();

      if (message.role === "tool") {
        result.push({
          role: "tool",
          tool_call_id: message.toolCallId,
          content: message.content,
        });
      } else {
        result.push({ role: message.role, content: message.content });
      }
    }

    flushToolCalls();
    return result;
  }
}
