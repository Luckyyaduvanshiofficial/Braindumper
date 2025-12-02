"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { createIdea } from "@/lib/appwrite";
import AuthModal from "@/components/AuthModal";
import IdeaInput from "@/components/IdeaInput";
import MarkdownPreview from "@/components/MarkdownPreview";
import IdeaHistory from "@/components/IdeaHistory";

export default function Home() {
  const { user, loading: authLoading, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [currentInput, setCurrentInput] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [saveStatus, setSaveStatus] = useState(null);

  const handleGenerate = useCallback(async (input, useThinking, selectedModel) => {
    setIsGenerating(true);
    setGeneratedContent("");
    setCurrentInput(input);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: input, useThinking, selectedModel }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                setGeneratedContent((prev) => prev + content);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Generation error:", error);
      setGeneratedContent(`## Error\n\n${error.message}\n\nPlease check your API keys and try again.`);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      setSaveStatus("saving");
      // Extract title from content (first heading or first line)
      const titleMatch = generatedContent.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : currentInput.substring(0, 50);

      await createIdea(title, currentInput, generatedContent, user.$id);
      setSaveStatus("saved");
      setRefreshTrigger((prev) => prev + 1);
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      console.error("Save error:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 2000);
    }
  }, [user, generatedContent, currentInput]);

  const handleSelectIdea = useCallback((idea) => {
    setGeneratedContent(idea.generatedMarkdown);
    setCurrentInput(idea.rawInput);
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Brain Dumper
              </h1>
              <p className="text-xs text-gray-500">Ideas → Documentation</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            {authLoading ? (
              <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm"
                >
                  Sign Out
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-colors"
              >
                Sign In
              </motion.button>
            )}
          </motion.div>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.h2
            className="text-4xl md:text-6xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Transform Your Ideas
            </span>
            <br />
            <span className="text-white">into Reality</span>
          </motion.h2>
          
          <motion.p
            className="text-lg text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Explain your idea in <span className="text-purple-400">any language</span> and get a comprehensive 
            Markdown document ready for <span className="text-pink-400">GitHub Copilot</span> development
          </motion.p>

          {/* Features badges */}
          <motion.div
            className="flex flex-wrap justify-center gap-3 mt-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {[
              { icon: "🌍", text: "Any Language Input" },
              { icon: "🤖", text: "AI-Powered" },
              { icon: "📝", text: "Markdown Output" },
              { icon: "☁️", text: "Cloud Storage" },
            ].map((badge, i) => (
              <motion.span
                key={badge.text}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="px-3 py-1.5 rounded-full bg-gray-800/50 border border-gray-700 text-sm text-gray-300"
              >
                {badge.icon} {badge.text}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>

        {/* Input section */}
        <IdeaInput onGenerate={handleGenerate} isGenerating={isGenerating} />

        {/* Output section */}
        <AnimatePresence>
          {generatedContent && (
            <MarkdownPreview
              content={generatedContent}
              isStreaming={isGenerating}
              onSave={user ? handleSave : () => setShowAuthModal(true)}
              onCopy={() => {}}
              onDownload={() => {}}
            />
          )}
        </AnimatePresence>

        {/* Save status toast */}
        <AnimatePresence>
          {saveStatus && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg ${
                saveStatus === "saving"
                  ? "bg-gray-800 text-white"
                  : saveStatus === "saved"
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {saveStatus === "saving" && (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved to cloud!
                </>
              )}
              {saveStatus === "error" && (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Save failed
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History sidebar */}
      <IdeaHistory onSelectIdea={handleSelectIdea} refreshTrigger={refreshTrigger} />

      {/* Auth modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            Built with 💜 using Next.js, Appwrite & AI
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-600">Powered by:</span>
            {["Appwrite", "DeepSeek", "Gemini", "OpenRouter"].map((tech) => (
              <span key={tech} className="px-2 py-1 text-xs rounded bg-gray-800 text-gray-400">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
