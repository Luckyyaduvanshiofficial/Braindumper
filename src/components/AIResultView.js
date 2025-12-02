"use client";

import { motion } from "framer-motion";

export default function AIResultView({ result, onStartFocus }) {
  if (!result) return null;

  const { summary, sections, insights, currentFocus, tasks } = result;

  const focusTask = currentFocus?.taskId 
    ? tasks.find(t => t.id === currentFocus.taskId) 
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto space-y-6"
    >
      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20"
      >
        <div className="flex items-start gap-4">
          <div className="text-4xl">📋</div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Summary</h2>
            <p className="text-gray-300 leading-relaxed">{summary}</p>
          </div>
        </div>
      </motion.div>

      {/* Current Focus Card */}
      {focusTask && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <h2 className="text-xl font-bold text-white">Your Focus</h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-sm font-medium">
              Priority
            </span>
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-2">{focusTask.title}</h3>
          <p className="text-gray-300 mb-4">{focusTask.description}</p>
          
          {currentFocus.reason && (
            <p className="text-sm text-gray-400 italic mb-4">
              💡 {currentFocus.reason}
            </p>
          )}

          {focusTask.subtasks?.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Quick steps to get started:</p>
              <ul className="space-y-1">
                {focusTask.subtasks.slice(0, 3).map((step, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300">
                    <span className="w-5 h-5 rounded-full bg-gray-700 text-xs flex items-center justify-center">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onStartFocus(focusTask)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold hover:shadow-lg hover:shadow-orange-500/25 transition-all"
          >
            🚀 Start Focus Session
          </motion.button>
        </motion.div>
      )}

      {/* Sections */}
      {sections?.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid gap-4"
        >
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📂</span> Organized Thoughts
          </h2>
          
          <div className="grid gap-3">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="p-4 rounded-xl bg-gray-800/50 border border-gray-700"
              >
                <h3 className="font-semibold text-white mb-2">{section.title}</h3>
                <ul className="space-y-1">
                  {section.items.map((item, i) => (
                    <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                      <span className="text-gray-500">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Insights */}
      {insights?.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20"
        >
          <h3 className="font-semibold text-blue-300 mb-2 flex items-center gap-2">
            <span>💭</span> Insights
          </h3>
          <ul className="space-y-2">
            {insights.map((insight, i) => (
              <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                <span className="text-blue-400">→</span>
                {insight}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
}
