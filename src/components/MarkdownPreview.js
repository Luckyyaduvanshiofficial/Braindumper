"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownPreview({ content, isStreaming, onSave, onCopy, onDownload }) {
  const containerRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Auto-scroll while streaming
  useEffect(() => {
    if (isStreaming && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [content, isStreaming]);

  // Show actions after content appears
  useEffect(() => {
    if (content && !isStreaming) {
      setShowActions(true);
    }
  }, [content, isStreaming]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "idea.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onDownload?.();
  };

  if (!content) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto mt-8"
    >
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={isStreaming ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
            className={`w-3 h-3 rounded-full ${isStreaming ? 'bg-green-400' : 'bg-purple-400'}`}
          />
          <h3 className="text-lg font-semibold text-white">
            {isStreaming ? "Generating..." : "Generated Documentation"}
          </h3>
        </div>

        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </motion.button>

              {onSave && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onSave}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save to Cloud
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Markdown content */}
      <motion.div
        ref={containerRef}
        className="relative rounded-2xl bg-gray-800/50 border border-gray-700 overflow-hidden"
      >
        {/* Streaming cursor effect */}
        {isStreaming && (
          <motion.div
            className="absolute bottom-4 right-4 flex items-center gap-2 text-purple-400"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <span className="text-sm">Writing</span>
            <span className="flex gap-1">
              <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}>.</motion.span>
              <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}>.</motion.span>
              <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}>.</motion.span>
            </span>
          </motion.div>
        )}

        <div className="max-h-[600px] overflow-y-auto p-6 prose prose-invert prose-lg max-w-none
          prose-headings:text-white prose-headings:font-bold
          prose-h1:text-3xl prose-h1:bg-gradient-to-r prose-h1:from-purple-400 prose-h1:to-pink-400 prose-h1:bg-clip-text prose-h1:text-transparent
          prose-h2:text-2xl prose-h2:text-purple-300
          prose-h3:text-xl prose-h3:text-pink-300
          prose-p:text-gray-300
          prose-strong:text-white
          prose-code:bg-gray-700 prose-code:text-pink-300 prose-code:px-2 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700
          prose-ul:text-gray-300
          prose-ol:text-gray-300
          prose-li:marker:text-purple-400
          prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline
          prose-blockquote:border-l-purple-500 prose-blockquote:bg-gray-800/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r
          prose-table:border-collapse
          prose-th:bg-gray-700 prose-th:text-white prose-th:p-2 prose-th:border prose-th:border-gray-600
          prose-td:p-2 prose-td:border prose-td:border-gray-600
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>

          {/* Blinking cursor at the end while streaming */}
          {isStreaming && (
            <motion.span
              className="inline-block w-2 h-5 bg-purple-400 ml-1"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
