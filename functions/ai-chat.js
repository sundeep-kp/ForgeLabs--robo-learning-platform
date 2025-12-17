// functions/ai-chat.js
// Cloudflare Pages Function — POST /ai-chat
// Gemini Native API (stable, supported, sane)

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Method guard
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // Env sanity check
    if (!env || !env.GOOGLE_API_KEY) {
      return json(
        { error: "GOOGLE_API_KEY missing in Cloudflare Pages env" },
        500
      );
    }

    // Parse request body
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
    // CONFIG (Gemini Native)
    // ===============================
    const MODEL = "models/gemini-1.5-flash";
    const API_URL =
      `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${env.GOOGLE_API_KEY}`;

    // ===============================
    // PROMPT CONSTRUCTION
    // ===============================
    const trimmedHistory = history.slice(-6); // last 3 exchanges

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
    // REQUEST WITH TIMEOUT
    // ===============================
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    let responseText;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 500
          }
        }),
        signal: controller.signal
      });

      responseText = await res.text();

      if (!res.ok) {
        console.error("Gemini HTTP error:", responseText);
        return json({ error: "Gemini API request failed" }, 500);
      }

    } finally {
      clearTimeout(timeout);
    }

    // ===============================
    // RESPONSE PARSING
    // ===============================
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("Non-JSON Gemini response:", responseText);
      return json({ error: "Invalid response from Gemini" }, 500);
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map(p => p.text)
        ?.join("") || null;

    if (!reply) {
      console.error("Empty Gemini response:", data);
      return json({ error: "Empty response from Gemini" }, 500);
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
