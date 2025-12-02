// AI Service for Brain Dumper
// Uses DeepSeek API primarily, with OpenRouter as fallback

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT = `You are an expert technical documentation writer and software architect. Your job is to take a user's raw idea explanation (which may be in any language, informal, or unstructured) and transform it into a comprehensive, well-structured Markdown document that can be used directly with GitHub Copilot for development.

When processing an idea, you must:

1. **Understand the Core Concept**: Extract the main idea, problem it solves, and target users.

2. **Create a Comprehensive Document** with these sections:
   - **Project Title**: A clear, concise name
   - **Executive Summary**: 2-3 sentences explaining the idea
   - **Problem Statement**: What problem does this solve?
   - **Solution Overview**: How does this idea solve the problem?
   - **Target Users**: Who will use this?
   - **Key Features**: Bulleted list of main features
   - **Technical Requirements**: What needs to be built
   - **Tech Stack Recommendations**: Based on the requirements, suggest appropriate technologies
   - **Database Schema**: If applicable, suggest data models
   - **API Endpoints**: If applicable, suggest REST/GraphQL endpoints
   - **User Stories**: As a [user], I want [feature], so that [benefit]
   - **Development Phases**: Break down into MVP, Phase 2, Phase 3
   - **Potential Challenges**: What might be difficult?
   - **Success Metrics**: How to measure success?

3. **Tech Stack Rules** (ALWAYS follow these):
   - **Backend**: Always use Appwrite as the Backend-as-a-Service for:
     - Authentication
     - Database
     - Storage
     - Functions
   - **AI Integration**: 
     - Primary: OpenRouter API (prefer free models)
     - Secondary: DeepSeek API (for thinking/reasoning tasks)
     - Azure AI for enterprise/advanced AI needs
   - **Frontend**: Suggest modern frameworks (Next.js, React, Vue, etc.)

4. **Output Format**:
   - Use proper Markdown formatting
   - Include code blocks where helpful
   - Use tables for structured data
   - Add mermaid diagrams for flows if helpful
   - Make it GitHub Copilot friendly with clear comments

5. **Language**: Always output in English, regardless of input language.

Remember: The output should be so detailed that a developer can directly paste it into their IDE with GitHub Copilot and start building immediately.`;

export async function generateIdeaDocument(userInput, useThinking = false, apiKey = null) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Please analyze and document this idea:\n\n${userInput}` },
  ];

  // Try DeepSeek first
  if (apiKey || process.env.DEEPSEEK_API_KEY) {
    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey || process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: useThinking ? "deepseek-reasoner" : "deepseek-chat",
          messages,
          max_tokens: 4000,
          temperature: 0.7,
          stream: true,
        }),
      });

      if (response.ok) {
        return response;
      }
    } catch (error) {
      console.error("DeepSeek API error:", error);
    }
  }

  // Fallback to OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "Brain Dumper",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat-free", // Free model on OpenRouter
          messages,
          max_tokens: 4000,
          temperature: 0.7,
          stream: true,
        }),
      });

      if (response.ok) {
        return response;
      }
    } catch (error) {
      console.error("OpenRouter API error:", error);
    }
  }

  throw new Error("No AI API available. Please configure DeepSeek or OpenRouter API key.");
}

export function parseSSEStream(reader) {
  const decoder = new TextDecoder();
  let buffer = "";

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                controller.close();
                return;
              }
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(content);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
