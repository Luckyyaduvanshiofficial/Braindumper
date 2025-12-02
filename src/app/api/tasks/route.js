import { NextResponse } from "next/server";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const BREAKDOWN_PROMPT = `You are a helpful task breakdown assistant. Given a task, break it down into 3-5 tiny, actionable steps that take 5-15 minutes each.

Respond in valid JSON only:
{
  "steps": [
    {
      "id": string,
      "title": string,
      "timeEstimate": string,
      "tip": string | null
    }
  ],
  "encouragement": string
}`;

export async function POST(request) {
  try {
    const { taskId, title, description, action } = await request.json();

    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return NextResponse.json(
        { error: "AI API key not configured" },
        { status: 500 }
      );
    }

    if (action === "breakdown") {
      const userPrompt = `Break down this task into tiny steps:\n\nTask: ${title}\nDetails: ${description || "No additional details"}`;

      const response = await fetch(
        `${GEMINI_API_URL}/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${BREAKDOWN_PROMPT}\n\n---\n\n${userPrompt}` }],
              },
            ],
            generationConfig: {
              maxOutputTokens: 1000,
              temperature: 0.7,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        return NextResponse.json(
          { error: "Failed to break down task" },
          { status: 500 }
        );
      }

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const result = JSON.parse(aiText);

      return NextResponse.json(result);
    }

    if (action === "help") {
      const helpPrompt = `You are a productivity coach. The user is stuck on a task. Give them 2-3 practical tips to get started. Be encouraging and concise.

Respond in valid JSON:
{
  "tips": [string],
  "motivation": string
}`;

      const userPrompt = `I'm stuck on this task:\n\nTask: ${title}\nDetails: ${description || "No additional details"}`;

      const response = await fetch(
        `${GEMINI_API_URL}/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${helpPrompt}\n\n---\n\n${userPrompt}` }],
              },
            ],
            generationConfig: {
              maxOutputTokens: 500,
              temperature: 0.8,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        return NextResponse.json(
          { error: "Failed to get help" },
          { status: 500 }
        );
      }

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const result = JSON.parse(aiText);

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Task AI error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
