"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getIdeas, deleteIdea } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";

export default function IdeaHistory({ onSelectIdea, refreshTrigger }) {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (user) {
      fetchIdeas();
    } else {
      setIdeas([]);
      setLoading(false);
    }
  }, [user, refreshTrigger]);

  async function fetchIdeas() {
    try {
      setLoading(true);
      const docs = await getIdeas(user.$id);
      setIdeas(docs);
    } catch (error) {
      console.error("Error fetching ideas:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(ideaId) {
    try {
      await deleteIdea(ideaId);
      setIdeas(ideas.filter((idea) => idea.$id !== ideaId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting idea:", error);
    }
  }

  const formatDate = (dateStr) => {
    // Use a fixed format to avoid hydration mismatch
    const date = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${month} ${day}, ${year}, ${hour12}:${minutes} ${ampm}`;
  };

  if (!user) return null;

  return (
    <>
      {/* Toggle button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed left-4 top-1/2 -translate-y-1/2 z-40 bg-gray-800 border border-gray-700 rounded-full p-3 text-white shadow-lg hover:bg-gray-700 transition-colors"
      >
        <motion.svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          animate={{ rotate: isOpen ? 180 : 0 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </motion.svg>
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-gray-900 border-r border-gray-700 z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Your Ideas
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Ideas list */}
              <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <motion.div
                      className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                ) : ideas.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <p>No ideas yet</p>
                    <p className="text-sm mt-1">Start dumping your brain!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ideas.map((idea, index) => (
                      <motion.div
                        key={idea.$id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group relative bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-purple-500/50 transition-all cursor-pointer"
                        onClick={() => {
                          onSelectIdea(idea);
                          setIsOpen(false);
                        }}
                      >
                        <h3 className="font-semibold text-white mb-1 pr-8 truncate">
                          {idea.title || "Untitled Idea"}
                        </h3>
                        <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                          {idea.rawInput?.substring(0, 100)}...
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(idea.createdAt)}
                        </p>

                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(idea.$id);
                          }}
                          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>

                        {/* Delete confirmation */}
                        <AnimatePresence>
                          {deleteConfirm === idea.$id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="absolute inset-0 bg-gray-800 rounded-xl flex items-center justify-center gap-2 border border-red-500/50"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-sm text-white">Delete?</span>
                              <button
                                onClick={() => handleDelete(idea.$id)}
                                className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-500 transition-colors"
                              >
                                No
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Refresh button */}
              <div className="p-4 border-t border-gray-700">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={fetchIdeas}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
