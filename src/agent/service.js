import { buildSupportInstructions } from "./prompt.js";
import { createResponse } from "./openai.js";
import { extractAssistantText, extractFunctionCalls } from "./response-parser.js";
import { createChatSession, ensureChatSession, updateSessionResponse } from "./session-store.js";
import { executeToolCall, toolDefinitions } from "./tools.js";

const MAX_TOOL_ROUNDS = 6;

function buildInitialPayload(session, message) {
  return {
    model: process.env.OPENAI_MODEL || "gpt-5-mini",
    instructions: buildSupportInstructions(),
    input: message,
    tools: toolDefinitions,
    ...(session.responseId ? { previous_response_id: session.responseId } : {})
  };
}

function safeParseArguments(jsonString) {
  try {
    return jsonString ? JSON.parse(jsonString) : {};
  } catch {
    return {};
  }
}

export { createChatSession };

export async function processCustomerMessage({ sessionId, message }) {
  const session = ensureChatSession(sessionId);
  let response = await createResponse(buildInitialPayload(session, message));
  let toolRounds = 0;
  let executedToolCalls = 0;

  while (toolRounds < MAX_TOOL_ROUNDS) {
    const functionCalls = extractFunctionCalls(response);

    if (!functionCalls.length) {
      break;
    }

    const toolOutputs = [];

    for (const call of functionCalls) {
      const args = safeParseArguments(call.arguments);
      const output = await executeToolCall(call.name, args);
      executedToolCalls += 1;

      toolOutputs.push({
        type: "function_call_output",
        call_id: call.call_id,
        output: JSON.stringify(output)
      });
    }

    response = await createResponse({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      instructions: buildSupportInstructions(),
      previous_response_id: response.id,
      input: toolOutputs,
      tools: toolDefinitions
    });

    toolRounds += 1;
  }

  updateSessionResponse(sessionId, response.id);

  return {
    sessionId,
    responseId: response.id,
    reply: extractAssistantText(response) || "请求已经处理完成，但模型没有返回可展示的文本内容。",
    toolCalls: executedToolCalls
  };
}
