"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BUCKET_CONFIG = {
  now: {
    title: "Now",
    emoji: "🔥",
    color: "from-red-500/20 to-orange-500/20",
    border: "border-red-500/30",
    badge: "bg-red-500/20 text-red-300",
  },
  next: {
    title: "Next",
    emoji: "⏳",
    color: "from-yellow-500/20 to-amber-500/20",
    border: "border-yellow-500/30",
    badge: "bg-yellow-500/20 text-yellow-300",
  },
  later: {
    title: "Later",
    emoji: "📦",
    color: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/30",
    badge: "bg-blue-500/20 text-blue-300",
  },
};

const PRIORITY_COLORS = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

export default function TaskBoard({ tasks, currentFocus, onTaskUpdate, onStartFocus }) {
  const [expandedTask, setExpandedTask] = useState(null);

  const tasksByBucket = {
    now: tasks.filter((t) => t.bucket === "now"),
    next: tasks.filter((t) => t.bucket === "next"),
    later: tasks.filter((t) => t.bucket === "later"),
  };

  const handleStatusChange = (taskId, newStatus) => {
    onTaskUpdate(taskId, { status: newStatus });
  };

  const handleBucketChange = (taskId, newBucket) => {
    onTaskUpdate(taskId, { bucket: newBucket });
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>📋</span> Task Board
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>{tasks.filter(t => t.status === "done").length}</span>
          <span>/</span>
          <span>{tasks.length} done</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(BUCKET_CONFIG).map(([bucket, config]) => (
          <div
            key={bucket}
            className={`rounded-2xl bg-gradient-to-b ${config.color} border ${config.border} p-4`}
          >
            {/* Bucket Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <span>{config.emoji}</span>
                {config.title}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.badge}`}>
                {tasksByBucket[bucket].length}
              </span>
            </div>

            {/* Tasks */}
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {tasksByBucket[bucket].map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`group relative p-4 rounded-xl bg-gray-800/80 border border-gray-700 hover:border-gray-600 transition-all cursor-pointer ${
                      task.status === "done" ? "opacity-50" : ""
                    } ${currentFocus?.taskId === task.id ? "ring-2 ring-orange-500" : ""}`}
                    onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                  >
                    {/* Priority indicator */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${PRIORITY_COLORS[task.priority]}`} />

                    {/* Task content */}
                    <div className="pl-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          {/* Checkbox */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(
                                task.id,
                                task.status === "done" ? "todo" : "done"
                              );
                            }}
                            className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                              task.status === "done"
                                ? "bg-green-500 border-green-500"
                                : "border-gray-600 hover:border-gray-500"
                            }`}
                          >
                            {task.status === "done" && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>

                          <div>
                            <h4 className={`font-medium text-white ${task.status === "done" ? "line-through" : ""}`}>
                              {task.title}
                            </h4>
                            {task.category && (
                              <span className="text-xs text-gray-500">{task.category}</span>
                            )}
                          </div>
                        </div>

                        {/* Focus button */}
                        {bucket === "now" && task.status !== "done" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartFocus(task);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-all"
                            title="Start focus session"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Expanded content */}
                      <AnimatePresence>
                        {expandedTask === task.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-gray-700"
                          >
                            {task.description && (
                              <p className="text-sm text-gray-400 mb-3">{task.description}</p>
                            )}

                            {task.subtasks?.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs text-gray-500 mb-1">Subtasks:</p>
                                <ul className="space-y-1">
                                  {task.subtasks.map((sub, i) => (
                                    <li key={i} className="text-xs text-gray-400 flex items-center gap-1">
                                      <span className="w-1 h-1 rounded-full bg-gray-600" />
                                      {sub}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Move to bucket buttons */}
                            <div className="flex gap-2">
                              {Object.entries(BUCKET_CONFIG)
                                .filter(([b]) => b !== bucket)
                                .map(([b, c]) => (
                                  <button
                                    key={b}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleBucketChange(task.id, b);
                                    }}
                                    className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-400 hover:text-white transition-all"
                                  >
                                    Move to {c.title}
                                  </button>
                                ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {tasksByBucket[bucket].length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No tasks here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
