import test from "node:test";
import assert from "node:assert/strict";

import { extractAssistantText, extractFunctionCalls } from "../src/agent/response-parser.js";

test("extractAssistantText 可以直接读取 output_text 字段", () => {
  const response = {
    output_text: "你好，这里是智能客服。"
  };

  assert.equal(extractAssistantText(response), "你好，这里是智能客服。");
});

test("extractAssistantText 可以回退读取 message content", () => {
  const response = {
    output: [
      {
        type: "message",
        content: [
          {
            type: "output_text",
            text: "已找到对应订单。"
          }
        ]
      }
    ]
  };

  assert.equal(extractAssistantText(response), "已找到对应订单。");
});

test("extractFunctionCalls 只返回函数调用项", () => {
  const response = {
    output: [
      { type: "reasoning" },
      { type: "function_call", name: "check_order_status", call_id: "call_123", arguments: "{}" }
    ]
  };

  assert.deepEqual(extractFunctionCalls(response), [
    { type: "function_call", name: "check_order_status", call_id: "call_123", arguments: "{}" }
  ]);
});
