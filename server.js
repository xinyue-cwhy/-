import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnv } from "./src/env.js";
import { createChatSession, processCustomerMessage } from "./src/agent/service.js";

loadEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");
const port = Number.parseInt(process.env.PORT || "3000", 10);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(body));
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
  } catch {
    throw new Error("INVALID_JSON");
  }
}

async function serveStatic(requestPath, response) {
  const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.normalize(path.join(publicDir, normalizedPath));

    if (!filePath.startsWith(publicDir)) {
    sendJson(response, 403, { error: "禁止访问。" });
    return;
  }

  try {
    const file = await readFile(filePath);
    const extension = path.extname(filePath);

    response.writeHead(200, {
      "Content-Type": mimeTypes[extension] || "application/octet-stream",
      "Cache-Control": extension === ".html" ? "no-store" : "public, max-age=300"
    });
    response.end(file);
  } catch {
    sendJson(response, 404, { error: "资源不存在。" });
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, {
      ok: true,
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      company: process.env.SUPPORT_COMPANY_NAME || "星购商城"
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/session") {
    const session = createChatSession();
    sendJson(response, 201, session);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/chat") {
    let payload;

    try {
      payload = await readJsonBody(request);
    } catch (error) {
      if (error.message === "INVALID_JSON") {
        sendJson(response, 400, { error: "请求体必须是合法的 JSON。" });
        return;
      }

      throw error;
    }

    if (!payload.sessionId || !payload.message) {
      sendJson(response, 400, { error: "必须提供 sessionId 和 message。" });
      return;
    }

    try {
      const result = await processCustomerMessage({
        sessionId: String(payload.sessionId),
        message: String(payload.message)
      });

      sendJson(response, 200, result);
    } catch (error) {
      const statusCode = error.message === "OPENAI_API_KEY_MISSING" ? 500 : 502;
      sendJson(response, statusCode, {
        error: error.message === "OPENAI_API_KEY_MISSING"
          ? "缺少 OPENAI_API_KEY。请先将 .env.example 复制为 .env 并填写密钥。"
          : "智能客服请求失败。",
        detail: error.message
      });
    }
    return;
  }

  if (request.method === "GET") {
    await serveStatic(url.pathname, response);
    return;
  }

  sendJson(response, 405, { error: "不支持该请求方法。" });
});

server.listen(port, () => {
  console.log(`智能客服服务已启动：http://localhost:${port}`);
});
