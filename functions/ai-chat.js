// functions/ai-chat.js
// Cloudflare Pages Function — POST /ai-chat
// Primary: Gemma 3
// Fallback: Gemini 1.5 Flash / Pro

export async function onRequestPost({ request, env }) {
  try {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const userMessage = body.message;
    const lessonId = body.lessonId || "general";
    const history = Array.isArray(body.history) ? body.history : [];

    if (!userMessage || typeof userMessage !== "string") {
      return json({ error: "Missing or invalid message" }, 400);
    }

    // ===============================
    // CONFIG
    // ===============================
    const PRIMARY_MODEL = "gemma-3-4b-instruct";
    const FALLBACK_MODELS = [
      "gemini-1.5-flash",
      "gemini-1.5-pro"
    ];

    const API_URL =
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

    const API_KEY = env.GOOGLE_API_KEY;

    // ===============================
    // PROMPT CONSTRUCTION
    // ===============================
    const trimmedHistory = history.slice(-6); // last 3 turns max

    const messages = [
      {
        role: "system",
        content:
          "You are a robotics debugging assistant. Be concise, practical, and technical."
      },
      {
        role: "user",
        content: `Context: lesson "${lessonId}".`
      },
      ...trimmedHistory.map(m => ({
        role: m.sender === "AI" ? "assistant" : "user",
        content: m.text
      })),
      {
        role: "user",
        content: userMessage
      }
    ];

    // ===============================
    // REQUEST WITH TIMEOUT
    // ===============================
    async function callModel(modelName) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20_000);

      try {
        const res = await fetch(
          `${API_URL}?key=${API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: modelName,
              messages,
              max_tokens: 500,
              temperature: 0.4,
              stream: false
            }),
            signal: controller.signal
          }
        );

        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(
            data?.error?.message || `Model ${modelName} failed`
          );
        }

        const reply = data?.choices?.[0]?.message?.content;
        if (!reply || typeof reply !== "string") {
          throw new Error(`Empty response from ${modelName}`);
        }

        return reply;

      } finally {
        clearTimeout(timeout);
      }
    }

    // ===============================
    // MODEL ROUTING
    // ===============================
    let reply;

    try {
      // Try Gemma first
      reply = await callModel(PRIMARY_MODEL);
    } catch (err) {
      console.warn("Gemma failed, falling back:", err.message);

      for (const model of FALLBACK_MODELS) {
        try {
          reply = await callModel(model);
          break;
        } catch (fallbackErr) {
          console.warn(`Fallback ${model} failed:`, fallbackErr.message);
        }
      }
    }

    if (!reply) {
      return json(
        { error: "All AI models failed to respond" },
        500
      );
    }

    return json({ reply }, 200);

  } catch (err) {
    console.error("Function crash:", err);
    return json({ error: "Server error" }, 500);
  }
}

// ===============================
// HELPERS
// ===============================
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
