"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import { getDashboardStats } from "@/lib/appwrite";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    totalIdeas: 0,
    nowTasks: 0,
    nextTasks: 0,
    laterTasks: 0,
    totalTimeSpent: 0,
    streakDays: 0,
    thisWeekSessions: 0,
    thisWeekTasks: 0,
    thisWeekCompleted: 0,
    completionRate: 0,
    recentActivity: [],
    recentSessions: [],
    recentIdeas: [],
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setShowAuthModal(true);
      setLoading(false);
    } else if (user) {
      loadDashboardData();
    }
  }, [user, authLoading]);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);
      const dashboardStats = await getDashboardStats(user.$id);
      setStats(dashboardStats);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError("Failed to load dashboard data. Please check your database configuration.");
      // Fallback to localStorage if database fails
      loadLocalStorageData();
    } finally {
      setLoading(false);
    }
  }

  function loadLocalStorageData() {
    // Fallback: Load from localStorage - only on client side
    if (typeof window === "undefined") return;
    
    try {
      const sessions = JSON.parse(localStorage.getItem("braindump_sessions") || "[]");
      const ideas = JSON.parse(localStorage.getItem("braindump_ideas") || "[]");
      
      let totalTasks = 0;
      let completedTasks = 0;
      
      sessions.forEach(session => {
        totalTasks += session.tasks?.length || 0;
        completedTasks += session.tasks?.filter(t => t.status === "done").length || 0;
      });

      setStats(prev => ({
        ...prev,
        totalSessions: sessions.length,
        totalTasks,
        completedTasks,
        totalIdeas: ideas.length,
        streakDays: calculateLocalStreak(sessions),
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        recentActivity: [
          ...sessions.map(s => ({ type: "session_created", description: s.title || "Brain Dump Session", createdAt: s.createdAt, $id: s.id })),
          ...ideas.map(i => ({ type: "idea_created", description: i.title || "Idea Document", createdAt: i.createdAt, $id: i.id })),
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10),
      }));
    } catch (e) {
      console.error("Failed to load from localStorage:", e);
    }
  }

  function calculateLocalStreak(sessions) {
    if (sessions.length === 0) return 0;
    const today = new Date().toDateString();
    const hasToday = sessions.some(s => new Date(s.createdAt).toDateString() === today);
    return hasToday ? 1 : 0;
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "session_created": return "🧠";
      case "task_completed": return "✅";
      case "idea_created": return "💡";
      case "focus_started": return "🎯";
      case "focus_ended": return "⏱️";
      default: return "📌";
    }
  };

  const getActivityLabel = (type) => {
    switch (type) {
      case "session_created": return "Brain Dump";
      case "task_completed": return "Task Completed";
      case "idea_created": return "Idea Created";
      case "focus_started": return "Focus Started";
      case "focus_ended": return "Focus Ended";
      default: return "Activity";
    }
  };

  const statCards = [
    { label: "Brain Dumps", value: stats.totalSessions, icon: "🧠", color: "from-purple-500/20 to-pink-500/20", border: "border-purple-500/30" },
    { label: "Ideas Created", value: stats.totalIdeas, icon: "💡", color: "from-yellow-500/20 to-orange-500/20", border: "border-yellow-500/30" },
    { label: "Tasks Created", value: stats.totalTasks, icon: "📋", color: "from-blue-500/20 to-cyan-500/20", border: "border-blue-500/30" },
    { label: "Tasks Completed", value: stats.completedTasks, icon: "✅", color: "from-green-500/20 to-emerald-500/20", border: "border-green-500/30" },
  ];

  const weeklyCards = [
    { label: "Sessions This Week", value: stats.thisWeekSessions, icon: "📅" },
    { label: "Tasks This Week", value: stats.thisWeekTasks, icon: "📝" },
    { label: "Completed This Week", value: stats.thisWeekCompleted, icon: "🎉" },
    { label: "Current Streak", value: `${stats.streakDays} days`, icon: "🔥" },
  ];

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
              onClick={() => router.push("/")}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <span>📊</span> Dashboard
              </h1>
              <p className="text-xs text-gray-500">Your productivity overview</p>
            </div>
          </motion.div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={() => router.push("/settings")}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto py-8 px-4">
        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-medium">Database Connection Issue</p>
                <p className="text-sm text-yellow-300/70">{error}</p>
                <p className="text-sm text-yellow-300/70 mt-1">Showing data from local storage as fallback.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading your stats...</p>
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* Welcome */}
            {user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h2 className="text-2xl font-bold text-white mb-1">
                  Welcome back, {user.name?.split(" ")[0] || "there"}! 👋
                </h2>
                <p className="text-gray-400">Here's your productivity overview</p>
              </motion.div>
            )}

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {statCards.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-2xl bg-gradient-to-br ${stat.color} border ${stat.border}`}
                >
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Completion Rate & Time Spent */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {stats.totalTasks > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Task Completion Rate</h3>
                    <span className="text-2xl font-bold text-green-400">
                      {stats.completionRate}%
                    </span>
                  </div>
                  <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden mb-4">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.completionRate}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">
                      <span className="text-yellow-400">{stats.pendingTasks}</span> pending
                    </span>
                    <span className="text-gray-400">
                      <span className="text-blue-400">{stats.inProgressTasks}</span> in progress
                    </span>
                    <span className="text-gray-400">
                      <span className="text-green-400">{stats.completedTasks}</span> done
                    </span>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700"
              >
                <h3 className="text-lg font-bold text-white mb-4">Task Distribution</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                    <div className="text-2xl font-bold text-red-400">{stats.nowTasks}</div>
                    <div className="text-xs text-gray-400">Now</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                    <div className="text-2xl font-bold text-yellow-400">{stats.nextTasks}</div>
                    <div className="text-xs text-gray-400">Next</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                    <div className="text-2xl font-bold text-blue-400">{stats.laterTasks}</div>
                    <div className="text-xs text-gray-400">Later</div>
                  </div>
                </div>
                {stats.totalTimeSpent > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                    <span className="text-gray-400">Total Focus Time</span>
                    <span className="text-xl font-bold text-purple-400">
                      ⏱️ {formatTime(stats.totalTimeSpent)}
                    </span>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Weekly Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-8"
            >
              <h3 className="text-lg font-bold text-white mb-4">📅 This Week</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {weeklyCards.map((card, index) => (
                  <div
                    key={card.label}
                    className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50"
                  >
                    <div className="text-2xl mb-1">{card.icon}</div>
                    <div className="text-xl font-bold text-white">{card.value}</div>
                    <div className="text-xs text-gray-500">{card.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8"
            >
              <h3 className="text-lg font-bold text-white mb-4">⚡ Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "New Brain Dump", icon: "🧠", href: "/app", color: "bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/30" },
                  { label: "Create Idea Doc", icon: "📝", href: "/", color: "bg-pink-500/20 hover:bg-pink-500/30 border-pink-500/30" },
                  { label: "View History", icon: "📚", href: "/history", color: "bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30" },
                  { label: "Settings", icon: "⚙️", href: "/settings", color: "bg-gray-500/20 hover:bg-gray-500/30 border-gray-500/30" },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => router.push(action.href)}
                    className={`p-4 rounded-xl border ${action.color} transition-all text-left`}
                  >
                    <div className="text-2xl mb-2">{action.icon}</div>
                    <div className="text-sm font-medium text-white">{action.label}</div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <h3 className="text-lg font-bold text-white mb-4">📋 Recent Activity</h3>
              {stats.recentActivity.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-800/30 rounded-2xl border border-gray-700/50">
                  <div className="text-4xl mb-4">📭</div>
                  <p className="font-medium">No activity yet</p>
                  <p className="text-sm text-gray-600 mt-1">Start brain dumping to see your activity here!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recentActivity.map((item, index) => (
                    <motion.div
                      key={item.$id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="p-4 rounded-xl bg-gray-800/50 border border-gray-700 flex items-center gap-4"
                    >
                      <div className="text-2xl">
                        {getActivityIcon(item.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{item.description || "Activity"}</h4>
                        <p className="text-sm text-gray-400">
                          {getActivityLabel(item.type)}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(item.createdAt)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </main>
  );
}
