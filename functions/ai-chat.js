export default {
  async fetch(request, env) {
    // Only POST allowed
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // Parse incoming JSON
    let body;
    try {
      body = await request.json();
    } catch (err) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const userMessage = body.message || "";
    const lessonId = body.lessonId || "general";
    const history = body.history || [];

    if (!userMessage) {
      return new Response(JSON.stringify({ error: "Missing message" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Choose your model here
    const MODEL = "gemma-3-4b-instruct"; 
    // You can switch to: 
    // gemma-3-12b-instruct 
    // gemma-3-27b-instruct
    // gemma-3-1b-instruct

    // Build messages (system + history + user)
    const messages = [
      {
        role: "system",
        content: `You are a robotics learning assistant for ForgeLabs.
Explain concepts simply. Give step-by-step debugging help.
You may reference Arduino, ROS2, Dynamixel, kinematics, electronics, etc.
Lesson context: ${lessonId}.`
      },
      ...history.map(m => ({
        role: m.sender === "AI" ? "assistant" : "user",
        content: m.text
      })),
      { role: "user", content: userMessage }
    ];

    // Google AI Studio generative endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`;

    try {
      const response = await fetch(`${url}?key=${env.GOOGLE_API_KEY}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          stream: false,     // set to true later if you want streaming
          max_tokens: 500
        })
      });

      const data = await response.json();

      if (data.error) {
        return new Response(JSON.stringify({ error: data.error }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      const aiMessage =
        data?.choices?.[0]?.message?.content ||
        "I’m not sure, but something went wrong.";

      return new Response(
        JSON.stringify({ reply: aiMessage }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }
};
