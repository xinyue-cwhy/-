import { appendFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "../../data");

async function loadJson(filename) {
  const filePath = path.join(dataDir, filename);
  const content = await readFile(filePath, "utf-8");
  return JSON.parse(content);
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/u)
    .filter(Boolean);
}

function scoreByKeywordOverlap(queryTokens, targetText) {
  const targetTokens = new Set(normalizeText(targetText));
  let score = 0;

  for (const token of queryTokens) {
    if (targetTokens.has(token)) {
      score += 1;
    }
  }

  return score;
}

async function searchKnowledgeBase({ query, top_k = 3 }) {
  const articles = await loadJson("knowledge-base.json");
  const queryTokens = normalizeText(query);
  const results = articles
    .map((article) => ({
      ...article,
      score: scoreByKeywordOverlap(
        queryTokens,
        [article.title, article.summary, article.content, ...(article.keywords || [])].join(" ")
      )
    }))
    .filter((article) => article.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, Math.max(1, Math.min(Number(top_k) || 3, 5)))
    .map(({ id, title, summary, content, source }) => ({
      id,
      title,
      summary,
      content,
      source
    }));

  return {
    query,
    results,
    result_count: results.length
  };
}

async function checkOrderStatus({ order_id }) {
  const orders = await loadJson("orders.json");
  const order = orders.find((item) => item.order_id.toLowerCase() === String(order_id).toLowerCase());

  if (!order) {
    return {
      found: false,
      order_id,
      message: "没有查询到对应的订单号。"
    };
  }

  return {
    found: true,
    ...order
  };
}

function buildTicketId() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TICKET-${suffix}`;
}

async function appendTicket(ticket) {
  const outputPath = path.join(dataDir, "tickets.ndjson");
  await appendFile(outputPath, `${JSON.stringify(ticket)}\n`, "utf-8");
}

async function createEscalationTicket({
  customer_name,
  email,
  issue_summary,
  priority = "normal",
  order_id = ""
}) {
  const ticket = {
    ticket_id: buildTicketId(),
    customer_name: customer_name || "未知客户",
    email: email || "未提供",
    issue_summary,
    priority,
    order_id,
    created_at: new Date().toISOString(),
    queue: priority === "urgent" ? "优先客服队列" : "普通客服队列"
  };

  await appendTicket(ticket);

  return {
    success: true,
    ...ticket
  };
}

export const toolDefinitions = [
  {
    type: "function",
    name: "search_knowledge_base",
    description: "检索客服知识库、售后政策和商品常见问题。",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        query: {
          type: "string",
          description: "客户的问题描述，用于检索知识库。"
        },
        top_k: {
          type: "integer",
          description: "返回结果数量，范围为 1 到 5。"
        }
      },
      required: ["query"]
    }
  },
  {
    type: "function",
    name: "check_order_status",
    description: "根据客户提供的订单号查询订单状态和物流信息。",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        order_id: {
          type: "string",
          description: "订单号，例如 NS-2026-1001。"
        }
      },
      required: ["order_id"]
    }
  },
  {
    type: "function",
    name: "create_escalation_ticket",
    description: "当自助服务无法解决问题时，创建人工升级工单。",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        customer_name: {
          type: "string",
          description: "客户姓名。"
        },
        email: {
          type: "string",
          description: "客户邮箱，用于后续联系。"
        },
        issue_summary: {
          type: "string",
          description: "尚未解决问题的简要描述。"
        },
        priority: {
          type: "string",
          enum: ["low", "normal", "urgent"],
          description: "工单紧急程度。"
        },
        order_id: {
          type: "string",
          description: "相关订单号，如有。"
        }
      },
      required: ["issue_summary"]
    }
  }
];

const toolHandlers = {
  search_knowledge_base: searchKnowledgeBase,
  check_order_status: checkOrderStatus,
  create_escalation_ticket: createEscalationTicket
};

export async function executeToolCall(name, args) {
  const handler = toolHandlers[name];

  if (!handler) {
    throw new Error(`UNKNOWN_TOOL:${name}`);
  }

  return handler(args || {});
}
