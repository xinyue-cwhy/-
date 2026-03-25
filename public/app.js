const samples = [
  "退货政策是什么？",
  "订单 NS-2026-1001 现在到哪一步了？",
  "我的包裹损坏了，帮我升级人工处理。"
];

const state = {
  sessionId: null
};

const samplesNode = document.getElementById("samples");
const statusNode = document.getElementById("status");
const messagesNode = document.getElementById("messages");
const formNode = document.getElementById("chatForm");
const inputNode = document.getElementById("messageInput");
const sendButtonNode = document.getElementById("sendButton");
const resetButtonNode = document.getElementById("resetButton");
const templateNode = document.getElementById("messageTemplate");

function renderSamples() {
  for (const sample of samples) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.textContent = sample;
    button.addEventListener("click", () => {
      inputNode.value = sample;
      inputNode.focus();
    });
    samplesNode.append(button);
  }
}

function appendMessage(role, text) {
  const fragment = templateNode.content.cloneNode(true);
  const container = fragment.querySelector(".message");
  const roleNode = fragment.querySelector(".message-role");
  const bodyNode = fragment.querySelector(".message-body");

  container.classList.add(role === "assistant" ? "assistant" : "user");
  roleNode.textContent = role === "assistant" ? "智能客服" : "客户";
  bodyNode.textContent = text;
  messagesNode.append(fragment);
  messagesNode.scrollTop = messagesNode.scrollHeight;
}

async function createSession() {
  statusNode.textContent = "正在创建新会话…";
  const response = await fetch("/api/session", { method: "POST" });
  const data = await response.json();
  state.sessionId = data.sessionId;
  messagesNode.innerHTML = "";
  appendMessage(
    "assistant",
    "你好，我是你的智能客服。你可以问我退换货、发票、物流、订单状态，或让我升级人工支持。"
  );
  statusNode.textContent = `会话已就绪：${state.sessionId.slice(0, 8)}`;
}

async function sendMessage(message) {
  appendMessage("user", message);
  statusNode.textContent = "智能客服正在处理…";
  sendButtonNode.disabled = true;

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sessionId: state.sessionId,
      message
    })
  });

  const data = await response.json();

  if (!response.ok) {
    appendMessage("assistant", `请求失败：${data.error}${data.detail ? `\n${data.detail}` : ""}`);
    statusNode.textContent = "请求失败";
    sendButtonNode.disabled = false;
    return;
  }

  appendMessage("assistant", data.reply);
  statusNode.textContent = "会话已同步";
  sendButtonNode.disabled = false;
}

formNode.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = inputNode.value.trim();

  if (!message) {
    return;
  }

  inputNode.value = "";
  await sendMessage(message);
});

resetButtonNode.addEventListener("click", async () => {
  await createSession();
});

renderSamples();
createSession().catch((error) => {
  statusNode.textContent = "初始化失败";
  appendMessage("assistant", `初始化失败：${error.message}`);
});
