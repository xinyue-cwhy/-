# 智能客服项目

一个可直接运行的智能客服示例项目，适合当作最小可用版本的起点。它包含：

- 前端聊天界面
- Node.js 后端服务
- 基于 OpenAI Responses API 的智能体主循环
- 3 个客服工具：知识库检索、订单查询、人工升级
- 会话保持与样例业务数据

## 项目结构

```text
.
├── data/                 # FAQ 与订单样例数据
├── public/               # 原生前端页面
├── src/agent/            # agent 提示词、工具与主循环
├── tests/                # 基础单元测试
├── server.js             # HTTP 服务入口
└── .env.example          # 环境变量模板
```

## 快速启动

1. 复制环境变量模板并填写 OpenAI 密钥

```bash
cp .env.example .env
```

2. 启动服务

```bash
npm run dev
```

3. 打开浏览器访问

```text
http://localhost:3000
```

## 环境变量

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5-mini
PORT=3000
SUPPORT_COMPANY_NAME=星购商城
```

## 智能客服能力设计

### 1. 知识库检索

工具名：`search_knowledge_base`

适用场景：

- 退货退款
- 发票
- 发货时效
- 破损处理

### 2. 订单查询

工具名：`check_order_status`

适用场景：

- 客户提供订单号后查询状态
- 返回最新物流节点与预计送达时间

示例订单号：

- `NS-2026-1001`
- `NS-2026-1002`
- `NS-2026-1003`

### 3. 人工升级

工具名：`create_escalation_ticket`

适用场景：

- 包裹破损
- 复杂售后
- 超出知识库覆盖范围的问题

升级后的工单会被追加写入 `data/tickets.ndjson`。

## API

### `POST /api/session`

创建会话。

返回示例：

```json
{
  "sessionId": "uuid",
  "createdAt": "2026-03-25T09:00:00.000Z",
  "responseId": null
}
```

### `POST /api/chat`

请求体：

```json
{
  "sessionId": "uuid",
  "message": "订单 NS-2026-1001 现在到哪一步了？"
}
```

返回示例：

```json
{
  "sessionId": "uuid",
  "responseId": "resp_xxx",
  "reply": "你的订单已经打包完成，正在等待承运商揽收。",
  "toolCalls": 0
}
```

## 下一步建议

- 把 `data/knowledge-base.json` 替换成真实业务 FAQ
- 把 `data/orders.json` 对接真实 OMS/ERP
- 为 `create_escalation_ticket` 接入工单系统
- 增加登录、客服工作台、SLA 和埋点

## 技术说明

项目默认不依赖第三方 npm 包，便于快速启动和理解。Node 18+ 自带 `fetch`，因此可直接调用 OpenAI API。
