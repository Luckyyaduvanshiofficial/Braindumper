"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";

export default function HistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      setShowAuthModal(true);
    }
    // In a full implementation, fetch sessions from Appwrite
    // For now, we'll use localStorage
    const storedSessions = localStorage.getItem("braindump_sessions");
    if (storedSessions) {
      setSessions(JSON.parse(storedSessions));
    }
    setLoading(false);
  }, [user, authLoading]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  return (
    <main className="min-h-screen bg-gray-950 relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <button
              onClick={() => router.push("/app")}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">History</h1>
              <p className="text-xs text-gray-500">Your past brain dumps</p>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto py-12 px-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <motion.div
              className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        ) : sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-white mb-2">No history yet</h2>
            <p className="text-gray-400 mb-6">Start brain dumping to see your sessions here</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/app")}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium"
            >
              Start Brain Dumping
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedSession(selectedSession === session.id ? null : session.id)}
                className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700 hover:border-gray-600 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{session.title || "Untitled Session"}</h3>
                    <p className="text-sm text-gray-400 mb-2">{session.summary}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{formatDate(session.createdAt)}</span>
                      <span>•</span>
                      <span>{session.tasks?.length || 0} tasks</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.tasks?.filter(t => t.status === "done").length > 0 && (
                      <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-300 text-xs">
                        {session.tasks.filter(t => t.status === "done").length} done
                      </span>
                    )}
                    <motion.svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      animate={{ rotate: selectedSession === session.id ? 180 : 0 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </motion.svg>
                  </div>
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {selectedSession === session.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-700"
                    >
                      {/* Original dump */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Original Dump:</h4>
                        <p className="text-sm text-gray-300 bg-gray-900/50 p-3 rounded-lg">
                          {session.rawText || "No raw text available"}
                        </p>
                      </div>

                      {/* Tasks preview */}
                      {session.tasks?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Tasks:</h4>
                          <div className="space-y-2">
                            {session.tasks.slice(0, 5).map((task) => (
                              <div
                                key={task.id}
                                className={`flex items-center gap-2 text-sm ${
                                  task.status === "done" ? "text-gray-500 line-through" : "text-gray-300"
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${
                                  task.bucket === "now" ? "bg-red-500" :
                                  task.bucket === "next" ? "bg-yellow-500" : "bg-blue-500"
                                }`} />
                                {task.title}
                              </div>
                            ))}
                            {session.tasks.length > 5 && (
                              <p className="text-xs text-gray-500">
                                +{session.tasks.length - 5} more tasks
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Re-run AI on this dump
                          }}
                          className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:text-white text-sm transition-all"
                        >
                          🔄 Re-analyze
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Load this session into the app
                            router.push("/app");
                          }}
                          className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-sm transition-all"
                        >
                          📋 Load Session
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </main>
  );
}
