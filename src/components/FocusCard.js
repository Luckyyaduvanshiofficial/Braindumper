"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function FocusCard({ task, onComplete, onClose, onBreakdown }) {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [helpData, setHelpData] = useState(null);
  const [breakdownData, setBreakdownData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);

  // Timer
  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleGetHelp = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          title: task.title,
          description: task.description,
          action: "help",
        }),
      });
      const data = await res.json();
      setHelpData(data);
      setShowHelp(true);
    } catch (error) {
      console.error("Help error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBreakdown = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          title: task.title,
          description: task.description,
          action: "breakdown",
        }),
      });
      const data = await res.json();
      setBreakdownData(data);
    } catch (error) {
      console.error("Breakdown error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStep = (stepId) => {
    setCompletedSteps((prev) =>
      prev.includes(stepId)
        ? prev.filter((id) => id !== stepId)
        : [...prev, stepId]
    );
  };

  if (!task) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/95 backdrop-blur-xl p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-2xl"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-all"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Focus Mode Badge */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/30"
          >
            <span className="text-2xl">🎯</span>
            <span className="text-orange-300 font-medium">Focus Mode</span>
          </motion.div>
        </div>

        {/* Main Card */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-8">
          {/* Task Title */}
          <h1 className="text-3xl font-bold text-white text-center mb-4">
            {task.title}
          </h1>

          {/* Description */}
          {task.description && (
            <p className="text-gray-400 text-center mb-6">{task.description}</p>
          )}

          {/* Timer */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-4">
              <div className="text-5xl font-mono font-bold text-white">
                {formatTime(timeElapsed)}
              </div>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`p-3 rounded-full transition-all ${
                  isTimerRunning
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                }`}
              >
                {isTimerRunning ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Subtasks / Breakdown */}
          {(breakdownData?.steps || task.subtasks?.length > 0) && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-400 mb-3">
                {breakdownData ? "AI-Generated Steps:" : "Steps:"}
              </h3>
              <div className="space-y-2">
                {(breakdownData?.steps || task.subtasks.map((s, i) => ({ id: `step_${i}`, title: s }))).map((step, i) => (
                  <motion.div
                    key={step.id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer ${
                      completedSteps.includes(step.id || i)
                        ? "bg-green-500/10 border border-green-500/20"
                        : "bg-gray-700/50 hover:bg-gray-700"
                    }`}
                    onClick={() => toggleStep(step.id || i)}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        completedSteps.includes(step.id || i)
                          ? "bg-green-500 border-green-500"
                          : "border-gray-500"
                      }`}
                    >
                      {completedSteps.includes(step.id || i) && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <span className={`text-white ${completedSteps.includes(step.id || i) ? "line-through opacity-50" : ""}`}>
                        {step.title || step}
                      </span>
                      {step.timeEstimate && (
                        <span className="ml-2 text-xs text-gray-500">~{step.timeEstimate}</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {breakdownData?.encouragement && (
                <p className="mt-4 text-center text-sm text-purple-300 italic">
                  ✨ {breakdownData.encouragement}
                </p>
              )}
            </div>
          )}

          {/* Help Section */}
          <AnimatePresence>
            {showHelp && helpData && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20"
              >
                <h3 className="font-medium text-blue-300 mb-2 flex items-center gap-2">
                  <span>💡</span> Tips to Get Started
                </h3>
                <ul className="space-y-2 mb-3">
                  {helpData.tips?.map((tip, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-blue-400">→</span>
                      {tip}
                    </li>
                  ))}
                </ul>
                {helpData.motivation && (
                  <p className="text-sm text-purple-300 italic">💪 {helpData.motivation}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleGetHelp}
              disabled={isLoading}
              className="py-3 px-4 rounded-xl bg-gray-700 text-white hover:bg-gray-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <motion.div
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <>
                  <span>🤔</span> I'm Stuck
                </>
              )}
            </button>

            <button
              onClick={handleBreakdown}
              disabled={isLoading || breakdownData}
              className="py-3 px-4 rounded-xl bg-gray-700 text-white hover:bg-gray-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>✂️</span> Break it Down
            </button>
          </div>

          {/* Complete Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onComplete(task.id, Math.floor(timeElapsed / 60))}
            className="w-full mt-4 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg hover:shadow-lg hover:shadow-green-500/25 transition-all flex items-center justify-center gap-2"
          >
            <span>✅</span> Mark as Done {timeElapsed > 0 && `(${formatTime(timeElapsed)})`}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
