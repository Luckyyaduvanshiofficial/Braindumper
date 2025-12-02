"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function BrainDumpEditor({ onOrganize, isProcessing }) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !isProcessing) {
      onOrganize(text);
    }
  };

  const handleKeyDown = (e) => {
    // Cmd/Ctrl + Enter to submit
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleSubmit(e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4"
          >
            <span className="text-2xl">🧠</span>
            <span className="text-purple-300 font-medium">Brain Dump Mode</span>
          </motion.div>
          <p className="text-gray-400 text-sm">
            Type everything on your mind. Don't organize. Just dump.
          </p>
        </div>

        {/* Text area */}
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's on your mind? Tasks, worries, ideas, random thoughts... Just let it all out. Don't worry about formatting or order."
            className="w-full min-h-[300px] rounded-2xl bg-gray-800/50 border-2 border-gray-700 p-6 text-white text-lg placeholder-gray-500 resize-none focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all leading-relaxed"
            disabled={isProcessing}
            autoFocus
          />
          
          {/* Word count */}
          <div className="absolute bottom-4 right-4 text-gray-500 text-sm flex items-center gap-3">
            <span>{text.split(/\s+/).filter(Boolean).length} words</span>
            <span className="text-gray-600">•</span>
            <span className="text-xs text-gray-600">⌘ + Enter to organize</span>
          </div>
        </div>

        {/* Quick prompts */}
        {text.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2 justify-center"
          >
            {[
              "🎯 What needs to get done today?",
              "😰 What's stressing you out?",
              "💡 Any ideas floating around?",
              "📋 What's your backlog looking like?",
            ].map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setText(prompt.slice(2) + "\n\n")}
                className="px-3 py-1.5 text-sm rounded-full bg-gray-800/50 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-all"
              >
                {prompt}
              </button>
            ))}
          </motion.div>
        )}

        {/* Submit button */}
        <motion.button
          type="submit"
          disabled={!text.trim() || isProcessing}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 py-4 font-bold text-white text-lg shadow-lg hover:shadow-purple-500/25 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all relative overflow-hidden group"
        >
          <span className="relative z-10 flex items-center justify-center gap-3">
            {isProcessing ? (
              <>
                <motion.div
                  className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Organizing Your Brain...
              </>
            ) : (
              <>
                <span className="text-2xl">✨</span>
                Organize My Brain
              </>
            )}
          </span>
        </motion.button>
      </form>
    </motion.div>
  );
}
