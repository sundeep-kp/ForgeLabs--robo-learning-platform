// functions/ai-chat.js
// Cloudflare Pages Function — POST /ai-chat
// Gemini Native API (stable)

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    if (!env || !env.GOOGLE_API_KEY) {
      return json(
        { error: "GOOGLE_API_KEY missing in Cloudflare Pages env" },
        500
      );
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
    // CONFIG (USE THE MODEL THAT EXISTS)
    // ===============================
    const MODEL = "models/gemini-pro";
    const API_URL =
      `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${env.GOOGLE_API_KEY}`;

    // ===============================
    // PROMPT
    // ===============================
    const trimmedHistory = history.slice(-6);

    const contents = [
      {
        role: "user",
        parts: [
          {
            text:
              `You are a robotics debugging assistant.\n` +
              `Be concise, practical, and technical.\n` +
              `Lesson context: ${lessonId}`
          }
        ]
      },
      ...trimmedHistory.map(m => ({
        role: m.sender === "AI" ? "model" : "user",
        parts: [{ text: m.text }]
      })),
      {
        role: "user",
        parts: [{ text: userMessage }]
      }
    ];

    // ===============================
    // REQUEST
    // ===============================
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    let raw;
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 500
          }
        }),
        signal: controller.signal
      });

      raw = await res.text();

      if (!res.ok) {
        console.error("Gemini HTTP error:", raw);
        return json({ error: "Gemini API error" }, 500);
      }
    } finally {
      clearTimeout(timeout);
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error("Invalid JSON from Gemini:", raw);
      return json({ error: "Invalid Gemini response" }, 500);
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map(p => p.text)
        ?.join("");

    if (!reply) {
      console.error("Empty Gemini reply:", data);
      return json({ error: "Empty Gemini reply" }, 500);
    }

    return json({ reply }, 200);

  } catch (err) {
    console.error("Function crash:", err);
    return json({ error: "Server error" }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
