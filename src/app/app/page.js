"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import BrainDumpEditor from "@/components/BrainDumpEditor";
import AIResultView from "@/components/AIResultView";
import TaskBoard from "@/components/TaskBoard";
import FocusCard from "@/components/FocusCard";
import { createSession, createTask, updateTask, logActivity } from "@/lib/appwrite";

export default function AppPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [currentFocus, setCurrentFocus] = useState(null);
  const [focusTask, setFocusTask] = useState(null);
  const [view, setView] = useState("dump"); // "dump" | "result" | "board"
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const handleOrganize = useCallback(async (text) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/analyze-dump", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, userId: user.$id }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze");
      }

      const data = await response.json();
      setResult(data);
      
      // Generate a title from the first line or summary
      const title = text.split('\n')[0].substring(0, 100) || data.summary?.substring(0, 100) || "Brain Dump Session";
      
      // Save session to database
      let sessionId = null;
      try {
        const session = await createSession(user.$id, title, text, data);
        sessionId = session.$id;
        setCurrentSessionId(sessionId);
        console.log("Session saved:", sessionId);
      } catch (dbError) {
        console.error("Failed to save session to database:", dbError);
        // Continue even if DB save fails
      }
      
      // Save tasks to database and map with DB IDs
      const tasksWithDbIds = [];
      for (const task of data.tasks || []) {
        try {
          const savedTask = await createTask(user.$id, sessionId, {
            title: task.title,
            description: task.description || "",
            priority: task.priority || "medium",
            bucket: task.bucket || "now",
          });
          tasksWithDbIds.push({
            ...task,
            id: savedTask.$id,
            dbId: savedTask.$id,
          });
        } catch (taskError) {
          console.error("Failed to save task:", taskError);
          // Use local ID if DB save fails
          tasksWithDbIds.push({
            ...task,
            id: task.id || `local_${Date.now()}_${Math.random()}`,
          });
        }
      }
      
      setTasks(tasksWithDbIds);
      setCurrentFocus(data.currentFocus);
      setView("result");
    } catch (error) {
      console.error("Organize error:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [user]);

  const handleTaskUpdate = useCallback(async (taskId, updates) => {
    // Update local state immediately for responsiveness
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
    
    // Get the task to find its title for activity logging
    const task = tasks.find(t => t.id === taskId);
    
    // Sync to database
    if (taskId && !taskId.startsWith('local_')) {
      try {
        await updateTask(taskId, updates, user?.$id);
      } catch (error) {
        console.error("Failed to update task in database:", error);
      }
    }
  }, [tasks, user]);

  const handleStartFocus = useCallback(async (task) => {
    setFocusTask(task);
    
    // Log focus start activity
    if (user) {
      try {
        await logActivity(user.$id, "focus_started", `Started focusing on: ${task.title}`);
      } catch (error) {
        console.error("Failed to log focus activity:", error);
      }
    }
  }, [user]);

  const handleCompleteFocus = useCallback(async (taskId, timeSpent) => {
    const task = tasks.find(t => t.id === taskId);
    
    // Update task as completed
    await handleTaskUpdate(taskId, { 
      status: "done",
      timeSpent: timeSpent || 0,
    });
    
    // Log focus completion
    if (user) {
      try {
        await logActivity(user.$id, "focus_ended", `Completed focus on: ${task?.title || 'task'}`);
      } catch (error) {
        console.error("Failed to log focus completion:", error);
      }
    }
    
    setFocusTask(null);
  }, [handleTaskUpdate, tasks, user]);

  const handleNewDump = useCallback(() => {
    setResult(null);
    setTasks([]);
    setCurrentFocus(null);
    setCurrentSessionId(null);
    setView("dump");
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl">
              🧠
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                BrainDumper
              </h1>
              <p className="text-xs text-gray-500">Clarity in chaos</p>
            </div>
          </motion.div>

          <div className="flex items-center gap-4">
            {/* View toggles */}
            {result && (
              <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
                <button
                  onClick={() => setView("result")}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    view === "result"
                      ? "bg-purple-500 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setView("board")}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    view === "board"
                      ? "bg-purple-500 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Tasks
                </button>
              </div>
            )}

            {/* New dump button */}
            {result && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNewDump}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm flex items-center gap-2"
              >
                <span>➕</span> New Dump
              </motion.button>
            )}

            {/* User */}
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
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 py-12 px-4">
        {/* Onboarding for first-time users */}
        <AnimatePresence>
          {showOnboarding && view === "dump" && !result && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto mb-8"
            >
              <div className="text-center">
                <motion.h2
                  className="text-3xl md:text-4xl font-bold mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                    Clear Your Mind
                  </span>
                </motion.h2>
                <p className="text-gray-400 mb-6">
                  Dump everything → AI organizes → Focus on one thing
                </p>
                
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  {[
                    { step: "1", title: "Dump", desc: "Write everything on your mind", emoji: "📝" },
                    { step: "2", title: "Organize", desc: "AI creates order from chaos", emoji: "✨" },
                    { step: "3", title: "Focus", desc: "Work on one task at a time", emoji: "🎯" },
                  ].map((item, i) => (
                    <motion.div
                      key={item.step}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700"
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="text-left">
                        <p className="font-medium text-white">{item.title}</p>
                        <p className="text-xs text-gray-400">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Brain Dump Editor */}
        <AnimatePresence mode="wait">
          {view === "dump" && (
            <motion.div
              key="dump"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <BrainDumpEditor onOrganize={handleOrganize} isProcessing={isProcessing} />
            </motion.div>
          )}

          {view === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AIResultView 
                result={{ ...result, tasks }} 
                onStartFocus={handleStartFocus} 
              />

              {/* Suggested Replies */}
              {result.suggestedReplies?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="max-w-3xl mx-auto mt-8 flex flex-wrap justify-center gap-2"
                >
                  {result.suggestedReplies.map((reply, i) => (
                    <button
                      key={i}
                      className="px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-all text-sm"
                    >
                      {reply}
                    </button>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {view === "board" && tasks.length > 0 && (
            <motion.div
              key="board"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <TaskBoard
                tasks={tasks}
                currentFocus={currentFocus}
                onTaskUpdate={handleTaskUpdate}
                onStartFocus={handleStartFocus}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Focus Mode Overlay */}
      <AnimatePresence>
        {focusTask && (
          <FocusCard
            task={focusTask}
            onComplete={handleCompleteFocus}
            onClose={() => setFocusTask(null)}
          />
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </main>
  );
}
