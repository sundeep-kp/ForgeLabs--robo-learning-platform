// functions/ai-chat.js
// Cloudflare Pages Function — POST /ai-chat

export async function onRequestPost({ request, env }) {
  try {
    // Explicit method guard (useful for sanity checks)
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // Parse JSON safely
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userMessage = body.message;
    const lessonId = body.lessonId || "general";
    const history = Array.isArray(body.history) ? body.history : [];

    if (!userMessage || typeof userMessage !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid message" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ===============================
    // MODEL SELECTION (explicit)
    // ===============================
    const MODEL = "gemma-3-4b-instruct";
    // Alternatives (if enabled on your key):
    // gemma-3-12b-instruct
    // gemma-3-27b-instruct
    // gemma-3-1b-instruct

    // ===============================
    // BUILD CHAT MESSAGES
    // ===============================
    const messages = [
      {
        role: "system",
        content: `You are an AI debugging assistant for a robotics learning platform.
Explain concepts clearly and practically.
Give step-by-step debugging help when appropriate.
Lesson context: ${lessonId}.`
      },
      ...history.map(m => ({
        role: m.sender === "AI" ? "assistant" : "user",
        content: m.text
      })),
      {
        role: "user",
        content: userMessage
      }
    ];

    // ===============================
    // GOOGLE AI STUDIO (OpenAI-compatible)
    // ===============================
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions?key=${env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          max_tokens: 500,
          stream: false
        })
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error("Gemma API error:", data);
      return new Response(
        JSON.stringify({ error: "AI model failed to respond" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      "No response from AI.";

    return new Response(
      JSON.stringify({ reply }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Function crash:", err);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
