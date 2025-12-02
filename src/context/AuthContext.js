"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser, login, logout, createAccount } from "@/lib/appwrite";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(email, password) {
    const session = await login(email, password);
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    return session;
  }

  async function handleSignup(email, password, name) {
    const newUser = await createAccount(email, password, name);
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    return newUser;
  }

  async function handleLogout() {
    await logout();
    setUser(null);
  }

  const value = {
    user,
    loading,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    checkUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
