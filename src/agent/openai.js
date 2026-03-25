const OPENAI_URL = "https://api.openai.com/v1/responses";

export async function createResponse(payload) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY_MISSING");
  }

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OPENAI_API_ERROR:${response.status}:${detail}`);
  }

  return response.json();
}
