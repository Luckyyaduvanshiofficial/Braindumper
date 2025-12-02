"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { loginWithGoogle } from "@/lib/appwrite";

export default function AuthModal({ isOpen, onClose }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(email, password, name);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setError("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-4 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 sm:p-8 shadow-2xl border border-gray-700 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-3 top-3 sm:right-4 sm:top-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Logo/Title */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-5 sm:mb-8 text-center"
            >
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                Brain Dumper
              </h2>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-400">
                {mode === "login" ? "Welcome back!" : "Create your account"}
              </p>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <AnimatePresence mode="wait">
                {mode === "signup" && (
                  <motion.div
                    key="name"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2.5 sm:px-4 sm:py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all text-sm sm:text-base"
                      placeholder="Your name"
                      required={mode === "signup"}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2.5 sm:px-4 sm:py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all text-sm sm:text-base"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2.5 sm:px-4 sm:py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all text-sm sm:text-base"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm text-center"
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 py-2.5 sm:py-3 font-semibold text-white shadow-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : mode === "login" ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </motion.button>

              {/* Divider */}
              <div className="relative my-3 sm:my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-xs sm:text-sm">
                  <span className="bg-gray-800 px-3 sm:px-4 text-gray-400">or continue with</span>
                </div>
              </div>

              {/* Google Sign In Button */}
              <motion.button
                type="button"
                onClick={handleGoogleLogin}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-lg bg-white py-2.5 sm:py-3 font-semibold text-gray-800 shadow-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </motion.button>
            </form>

            {/* Toggle mode */}
            <p className="mt-4 sm:mt-6 text-center text-gray-400 text-sm sm:text-base">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={toggleMode}
                className="ml-2 text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
