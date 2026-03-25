import test from "node:test";
import assert from "node:assert/strict";

import { executeToolCall } from "../src/agent/tools.js";

test("知识库检索可以返回相关结果", async () => {
  const result = await executeToolCall("search_knowledge_base", {
    query: "How does the refund policy work?",
    top_k: 2
  });

  assert.equal(result.result_count > 0, true);
  assert.equal(result.results[0].id, "returns");
});

test("订单查询可以返回已知订单", async () => {
  const result = await executeToolCall("check_order_status", {
    order_id: "NS-2026-1002"
  });

  assert.equal(result.found, true);
  assert.equal(result.status, "已发货");
});
