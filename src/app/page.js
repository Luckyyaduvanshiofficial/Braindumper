"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createIdea, logActivity } from "@/lib/appwrite";
import AuthModal from "@/components/AuthModal";
import IdeaInput from "@/components/IdeaInput";
import MarkdownPreview from "@/components/MarkdownPreview";
import IdeaHistory from "@/components/IdeaHistory";

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [currentInput, setCurrentInput] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [saveStatus, setSaveStatus] = useState(null);
  const [activeMode, setActiveMode] = useState("ideas"); // "ideas" | "focus"

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
      const titleMatch = generatedContent.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : currentInput.substring(0, 50);

      await createIdea(title, currentInput, generatedContent, user.$id);
      
      // Log the activity
      try {
        await logActivity(user.$id, "idea_created", `Created idea: ${title}`);
      } catch (activityError) {
        console.error("Failed to log activity:", activityError);
      }
      
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl">
                🧠
              </div>
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                BrainDumper
              </h1>
              <p className="text-xs text-gray-500">Clear your mind, focus better</p>
            </div>
          </motion.div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-800/50 rounded-xl p-1 border border-gray-700">
            <button
              onClick={() => setActiveMode("ideas")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeMode === "ideas"
                  ? "bg-purple-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <span>📝</span>
              <span className="hidden sm:inline">Idea → Docs</span>
            </button>
            <button
              onClick={() => router.push("/app")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-all"
            >
              <span>🎯</span>
              <span className="hidden sm:inline">Focus Mode</span>
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            {authLoading ? (
              <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
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
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium"
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
          className="text-center mb-12"
        >
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Transform Ideas
            </span>
            <br />
            <span className="text-white">into Documentation</span>
          </motion.h2>
          
          <motion.p
            className="text-lg text-gray-400 max-w-2xl mx-auto mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Explain your idea in <span className="text-purple-400">any language</span> and get a comprehensive 
            spec ready for <span className="text-pink-400">development</span>
          </motion.p>

          {/* Feature cards */}
          <motion.div
            className="flex flex-wrap justify-center gap-4 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div 
              className="p-4 rounded-xl bg-gray-800/50 border border-gray-700 cursor-pointer hover:border-purple-500/50 transition-all"
              onClick={() => setActiveMode("ideas")}
            >
              <div className="text-3xl mb-2">📝</div>
              <h3 className="font-bold text-white">Idea → Docs</h3>
              <p className="text-xs text-gray-400">Create product specs</p>
            </div>
            <div 
              className="p-4 rounded-xl bg-gray-800/50 border border-gray-700 cursor-pointer hover:border-orange-500/50 transition-all"
              onClick={() => router.push("/app")}
            >
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-bold text-white">Focus Mode</h3>
              <p className="text-xs text-gray-400">Organize & focus on tasks</p>
            </div>
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
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
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
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1"
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => router.push("/history")}
              className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1"
            >
              📚 History
            </button>
            <button
              onClick={() => router.push("/settings")}
              className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1"
            >
              ⚙️ Settings
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}
