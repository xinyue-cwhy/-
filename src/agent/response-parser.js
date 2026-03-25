function extractOutputTextFromContent(content = []) {
  return content
    .filter((item) => item.type === "output_text")
    .map((item) => item.text)
    .join("\n")
    .trim();
}

export function extractAssistantText(response) {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const messages = Array.isArray(response.output) ? response.output : [];
  const textParts = [];

  for (const item of messages) {
    if (item.type === "message") {
      const text = extractOutputTextFromContent(item.content);

      if (text) {
        textParts.push(text);
      }
    }
  }

  return textParts.join("\n\n").trim();
}

export function extractFunctionCalls(response) {
  return (Array.isArray(response.output) ? response.output : []).filter(
    (item) => item.type === "function_call"
  );
}
