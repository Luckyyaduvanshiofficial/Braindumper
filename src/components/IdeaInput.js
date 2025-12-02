"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const placeholderExamples = [
  "I want to build a SaaS for tracking daily habits with gamification...",
  "मुझे एक ऐप बनानी है जो लोगों को खाना बांटने में मदद करे...",
];

const AI_MODELS = [
  { id: "gemini", name: "Gemini", icon: "✨", description: "Google AI" },
  { id: "deepseek", name: "DeepSeek", icon: "🧠", description: "Fast & accurate" },
];

export default function IdeaInput({ onGenerate, isGenerating }) {
  const [input, setInput] = useState("");
  const [useThinking, setUseThinking] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini");
  const [placeholder, setPlaceholder] = useState(placeholderExamples[0]);

  // Set random placeholder only on client-side to avoid hydration mismatch
  useEffect(() => {
    setPlaceholder(placeholderExamples[Math.floor(Math.random() * placeholderExamples.length)]);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isGenerating) {
      onGenerate(input, useThinking, selectedModel);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main input area */}
        <motion.div 
          className="relative"
          whileFocus={{ scale: 1.01 }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={(e) => {
              // Ensure paste works properly
              const pastedText = e.clipboardData.getData('text');
              if (pastedText) {
                e.preventDefault();
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                const newValue = input.substring(0, start) + pastedText + input.substring(end);
                setInput(newValue);
              }
            }}
            placeholder={placeholder}
            className="w-full h-48 rounded-2xl bg-gray-800/50 border border-gray-700 p-6 text-white placeholder-gray-500 resize-none focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all text-lg"
            disabled={isGenerating}
          />
          
          {/* Character count */}
          <div className="absolute bottom-4 right-4 text-gray-500 text-sm">
            {input.length} characters
          </div>
        </motion.div>

        {/* Options row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* AI Model selector */}
          <div className="flex items-center gap-2 bg-gray-800/50 rounded-xl p-1 border border-gray-700">
            {AI_MODELS.map((model) => (
              <motion.button
                key={model.id}
                type="button"
                onClick={() => setSelectedModel(model.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  selectedModel === model.id
                    ? "bg-purple-500 text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                <span>{model.icon}</span>
                <span className="font-medium">{model.name}</span>
              </motion.button>
            ))}
          </div>

          {/* Thinking mode toggle */}
          <motion.label
            className="flex items-center gap-3 cursor-pointer bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-700 hover:border-gray-600 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={useThinking}
                onChange={(e) => setUseThinking(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-12 h-6 rounded-full transition-colors flex items-center ${useThinking ? 'bg-purple-500' : 'bg-gray-600'}`}>
                <motion.div
                  className="w-5 h-5 rounded-full bg-white shadow-md"
                  animate={{ x: useThinking ? 26 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </div>
            </div>
            <div>
              <p className="text-white font-medium text-sm">Thinking Mode</p>
              <p className="text-xs text-gray-400">Deep reasoning</p>
            </div>
          </motion.label>
        </div>

        {/* Submit button */}
        <motion.button
          type="submit"
          disabled={!input.trim() || isGenerating}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 py-4 font-bold text-white text-lg shadow-lg hover:shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all relative overflow-hidden group"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isGenerating ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating Documentation...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Dump Your Brain!
              </>
            )}
          </span>
          
          {/* Animated gradient overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity"
            animate={isGenerating ? { 
              background: [
                "linear-gradient(to right, #8b5cf6, #ec4899, #f97316)",
                "linear-gradient(to right, #f97316, #8b5cf6, #ec4899)",
                "linear-gradient(to right, #ec4899, #f97316, #8b5cf6)",
              ]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.button>
      </form>

      {/* Helper text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 text-center text-gray-400 text-sm"
      >
        💡 Explain your idea in any language - I&apos;ll create a detailed Markdown document for GitHub Copilot
      </motion.p>
    </motion.div>
  );
}
