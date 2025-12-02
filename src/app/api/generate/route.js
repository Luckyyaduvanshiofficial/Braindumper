import { NextResponse } from "next/server";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const SYSTEM_PROMPT = `You are an expert product strategist and technical architect. Transform the user's raw idea into a beautifully structured Product & Flow Specification document.

## 📋 STRICT OUTPUT FORMAT (Follow Exactly):

# 🚀 [Product Name]
> [One-line tagline describing the product]

---

## 🎯 Goal & Principles

**Mission:** [Core mission statement]

**Guiding Principles:**
- 🔹 [Principle 1]
- 🔹 [Principle 2]
- 🔹 [Principle 3]

---

## 💡 Core Concepts

| Concept | Description |
|---------|-------------|
| 📦 [Entity 1] | [What it is] |
| 📦 [Entity 2] | [What it is] |

---

## 🗺️ App Structure & Navigation

- 🏠 **Home** - [Description]
- 📱 **Screen 2** - [Description]
- ⚙️ **Settings** - [Description]

---

## 🔄 User Flows

### Flow 1: [Flow Name] 📝
1. ➡️ User does [action]
2. ➡️ System responds with [response]
3. ✅ Result: [outcome]

### Flow 2: [Flow Name] 📝
1. ➡️ [Step 1]
2. ➡️ [Step 2]
3. ✅ [Result]

---

## 📱 Screen Specifications

### [Screen Name] 🖥️
- **Header:** [Description]
- **Main Content:** [Description]
- **Actions:** [Buttons/interactions]

---

## ⚙️ Business Rules & Logic

- ✅ [Rule 1]
- ✅ [Rule 2]
- ⚠️ [Constraint/Limitation]

---

## 🚨 Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| ❌ [Error case] | [How to handle] |
| ⚠️ [Edge case] | [Solution] |

---

## 🔮 Future Enhancements (V2+)

- 💎 [Feature 1]
- 💎 [Feature 2]
- 💎 [Feature 3]

---

## ✨ Implementation Summary

**Quick Start Checklist:**
- [ ] [Task 1]
- [ ] [Task 2]
- [ ] [Task 3]

**Tech Stack:** [Brief mention of recommended stack]

---

## 📝 FORMATTING RULES (MUST FOLLOW):

1. **ALWAYS use markdown headings** with # for main title, ## for sections
2. **ALWAYS use emojis** at the start of each section heading
3. **ALWAYS use bullet points** (- ) for lists, NEVER plain text paragraphs for lists
4. **ALWAYS use tables** for comparisons and structured data
5. **ALWAYS use horizontal rules** (---) between major sections
6. **ALWAYS use bold** (**text**) for emphasis
7. **ALWAYS use numbered lists** (1. 2. 3.) for sequential steps
8. **Use checkboxes** (- [ ]) for action items
9. **Use blockquotes** (>) for taglines or important notes
10. **Keep paragraphs short** - 2-3 sentences max

## ❌ NEVER DO:
- No code blocks or setup instructions
- No package.json or npm commands
- No environment configuration
- No lengthy technical implementation details
- No plain text walls without formatting

## ✅ ALWAYS DO:
- Output in English regardless of input language
- Be specific and actionable
- Think about user experience
- Include edge cases
- Make it visually scannable`;

export async function POST(request) {
  try {
    const { userInput, useThinking, selectedModel } = await request.json();

    if (!userInput) {
      return NextResponse.json({ error: "User input is required" }, { status: 400 });
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Transform this idea into a comprehensive Product & Flow Specification:\n\n${userInput}` },
    ];

    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    let response;
    let usedApi = "none";

    // Route based on selected model (default to Gemini)
    const model = selectedModel || "gemini";

    if (model === "gemini" && geminiKey) {
      // Use Gemini API
      try {
        const geminiModel = useThinking ? "gemini-2.5-flash-exp" : "gemini-2.5-flash";
        response = await fetch(`${GEMINI_API_URL}/${geminiModel}:streamGenerateContent?alt=sse&key=${geminiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${SYSTEM_PROMPT}\n\n---\n\nTransform this idea into a comprehensive Product & Flow Specification:\n\n${userInput}` }]
              }
            ],
            generationConfig: {
              maxOutputTokens: 8000,
              temperature: 0.7,
            },
          }),
        });

        if (response.ok) {
          usedApi = "gemini";
        }
      } catch (error) {
        console.error("Gemini API error:", error);
      }
    } else if (model === "deepseek" && deepseekKey) {
      // Use DeepSeek API
      try {
        response = await fetch(DEEPSEEK_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${deepseekKey}`,
          },
          body: JSON.stringify({
            model: useThinking ? "deepseek-reasoner" : "deepseek-chat",
            messages,
            max_tokens: 8000,
            temperature: 0.7,
            stream: true,
          }),
        });

        if (response.ok) {
          usedApi = "deepseek";
        }
      } catch (error) {
        console.error("DeepSeek API error:", error);
      }
    }

    // Fallback to OpenRouter if primary fails
    if (!response?.ok && openrouterKey) {
      try {
        response = await fetch(OPENROUTER_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openrouterKey}`,
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            "X-Title": "Brain Dumper",
          },
          body: JSON.stringify({
            model: "deepseek/deepseek-chat-free",
            messages,
            max_tokens: 8000,
            temperature: 0.7,
            stream: true,
          }),
        });

        if (response.ok) {
          usedApi = "openrouter";
        }
      } catch (error) {
        console.error("OpenRouter API error:", error);
      }
    }

    if (!response?.ok) {
      return NextResponse.json(
        { error: "No AI API available. Please configure API keys." },
        { status: 500 }
      );
    }

    // Handle Gemini's different SSE format
    if (usedApi === "gemini") {
      const transformStream = new TransformStream({
        transform(chunk, controller) {
          const text = new TextDecoder().decode(chunk);
          const lines = text.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (content) {
                  // Convert to OpenAI-style SSE format for client compatibility
                  const sseData = JSON.stringify({
                    choices: [{ delta: { content } }]
                  });
                  controller.enqueue(new TextEncoder().encode(`data: ${sseData}\n\n`));
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        },
      });

      response.body.pipeTo(transformStream.writable);

      return new Response(transformStream.readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Used-API": usedApi,
        },
      });
    }

    // Return streaming response for DeepSeek/OpenRouter
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(chunk);
      },
    });

    response.body.pipeTo(transformStream.writable);

    return new Response(transformStream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Used-API": usedApi,
      },
    });
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
