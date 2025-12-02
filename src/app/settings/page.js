"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [settings, setSettings] = useState({
    defaultModel: "gemini",
    thinkingMode: false,
    theme: "dark",
    autoSave: true,
    showTips: true,
    defaultView: "result",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      setShowAuthModal(true);
    }
    
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("braindump_settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, [user, authLoading]);

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem("braindump_settings", JSON.stringify(newSettings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all local data? This cannot be undone.")) {
      localStorage.removeItem("braindump_sessions");
      localStorage.removeItem("braindump_ideas");
      localStorage.removeItem("braindump_settings");
      alert("All local data cleared!");
      router.push("/");
    }
  };

  const handleExportData = () => {
    const data = {
      sessions: JSON.parse(localStorage.getItem("braindump_sessions") || "[]"),
      ideas: JSON.parse(localStorage.getItem("braindump_ideas") || "[]"),
      settings: settings,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `braindumper-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-gray-950 relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <span>⚙️</span> Settings
              </h1>
              <p className="text-xs text-gray-500">Customize your experience</p>
            </div>
          </motion.div>

          {saved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-sm"
            >
              ✓ Saved
            </motion.div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto py-8 px-4">
        {/* Account Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>👤</span> Account
          </h2>
          <div className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl text-white font-bold">
                    {user.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{user.name}</h3>
                    <p className="text-gray-400">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Member since {new Date(user.$createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 mb-4">Sign in to sync your data across devices</p>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </motion.section>

        {/* AI Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>🤖</span> AI Settings
          </h2>
          <div className="space-y-4">
            {/* Default Model */}
            <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">Default AI Model</h3>
                  <p className="text-sm text-gray-400">Choose your preferred AI model</p>
                </div>
                <select
                  value={settings.defaultModel}
                  onChange={(e) => handleSettingChange("defaultModel", e.target.value)}
                  className="px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:outline-none"
                >
                  <option value="gemini">✨ Gemini</option>
                  <option value="deepseek">🧠 DeepSeek</option>
                </select>
              </div>
            </div>

            {/* Thinking Mode */}
            <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">Thinking Mode by Default</h3>
                  <p className="text-sm text-gray-400">Enable deep reasoning for all generations</p>
                </div>
                <button
                  onClick={() => handleSettingChange("thinkingMode", !settings.thinkingMode)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    settings.thinkingMode ? "bg-purple-500" : "bg-gray-600"
                  }`}
                >
                  <motion.div
                    className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
                    animate={{ left: settings.thinkingMode ? 32 : 4 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Preferences */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>🎨</span> Preferences
          </h2>
          <div className="space-y-4">
            {/* Auto Save */}
            <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">Auto Save</h3>
                  <p className="text-sm text-gray-400">Automatically save your work</p>
                </div>
                <button
                  onClick={() => handleSettingChange("autoSave", !settings.autoSave)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    settings.autoSave ? "bg-purple-500" : "bg-gray-600"
                  }`}
                >
                  <motion.div
                    className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
                    animate={{ left: settings.autoSave ? 32 : 4 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>

            {/* Show Tips */}
            <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">Show Tips & Hints</h3>
                  <p className="text-sm text-gray-400">Display helpful tips throughout the app</p>
                </div>
                <button
                  onClick={() => handleSettingChange("showTips", !settings.showTips)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    settings.showTips ? "bg-purple-500" : "bg-gray-600"
                  }`}
                >
                  <motion.div
                    className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
                    animate={{ left: settings.showTips ? 32 : 4 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>

            {/* Default View */}
            <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">Default View (Focus Mode)</h3>
                  <p className="text-sm text-gray-400">What to show after organizing</p>
                </div>
                <select
                  value={settings.defaultView}
                  onChange={(e) => handleSettingChange("defaultView", e.target.value)}
                  className="px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:outline-none"
                >
                  <option value="result">📋 Summary View</option>
                  <option value="board">📊 Task Board</option>
                </select>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Data Management */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>💾</span> Data Management
          </h2>
          <div className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700 space-y-4">
            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-700/50 hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📤</span>
                <div className="text-left">
                  <h3 className="font-medium text-white">Export Data</h3>
                  <p className="text-sm text-gray-400">Download all your data as JSON</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={handleClearData}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🗑️</span>
                <div className="text-left">
                  <h3 className="font-medium text-red-400">Clear All Data</h3>
                  <p className="text-sm text-red-400/70">Delete all local data permanently</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </motion.section>

        {/* About */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>ℹ️</span> About
          </h2>
          <div className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700 text-center">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-xl font-bold text-white mb-2">BrainDumper</h3>
            <p className="text-gray-400 mb-4">Version 1.0.0</p>
            <p className="text-sm text-gray-500">
              Built with 💜 using Next.js, Appwrite & AI
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <span className="px-3 py-1 rounded-full bg-gray-700 text-gray-400 text-xs">Next.js 15</span>
              <span className="px-3 py-1 rounded-full bg-gray-700 text-gray-400 text-xs">Appwrite</span>
              <span className="px-3 py-1 rounded-full bg-gray-700 text-gray-400 text-xs">Gemini AI</span>
            </div>
          </div>
        </motion.section>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </main>
  );
}
