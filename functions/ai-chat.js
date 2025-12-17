// functions/ai-chat.js
// Cloudflare Pages Function — POST /ai-chat
// Gemini Native API with ordered fallback

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
    // MODEL FALLBACK ORDER (APPROVED)
    // ===============================
    const MODELS = [
      "models/gemma-3-4b-it",
      "models/gemma-3-1b-it",

      "models/gemini-2.5-flash",
      "models/gemini-2.5-pro",

      "models/gemini-2.0-flash",
      "models/gemini-2.0-flash-001",

      "models/gemini-2.0-flash-lite",
      "models/gemini-2.0-flash-lite-001"
    ];

    // ===============================
    // PROMPT CONSTRUCTION
    // ===============================
    const trimmedHistory = history.slice(-6);

    const contents = [
      {
        role: "user",
        parts: [
          {
            text:
              "You are a robotics debugging assistant.\n" +
              "Be concise, practical, and technical.\n" +
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
    // MODEL CALLER
    // ===============================
    async function callModel(model) {
      const url =
        `https://generativelanguage.googleapis.com/v1beta/` +
        `${model}:generateContent?key=${env.GOOGLE_API_KEY}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25_000);

      try {
        const res = await fetch(url, {
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

        const raw = await res.text();

        if (!res.ok) {
          throw new Error(raw);
        }

        const data = JSON.parse(raw);

        const reply =
          data?.candidates?.[0]?.content?.parts
            ?.map(p => p.text)
            ?.join("");

        if (!reply) {
          throw new Error("Empty reply");
        }

        return reply;
      } finally {
        clearTimeout(timeout);
      }
    }

    // ===============================
    // FALLBACK EXECUTION
    // ===============================
    let reply = null;
    let usedModel = null;

    for (const model of MODELS) {
      try {
        reply = await callModel(model);
        usedModel = model;
        console.log("AI response succeeded with:", model);
        break;
      } catch (err) {
        console.warn("Model failed:", model);
      }
    }

    if (!reply) {
      return json(
        { error: "All models failed to respond" },
        500
      );
    }

    return json(
      {
        reply,
        model: usedModel
      },
      200
    );

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
