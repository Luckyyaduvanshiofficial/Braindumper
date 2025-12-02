"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import FocusCard from "@/components/FocusCard";

export default function FocusPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId;
  const taskId = searchParams.get("taskId");

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a full implementation, you'd fetch the task from the database
    // For now, we'll use the task passed via URL state or localStorage
    const storedTask = localStorage.getItem(`focus_task_${taskId}`);
    if (storedTask) {
      setTask(JSON.parse(storedTask));
    }
    setLoading(false);
  }, [taskId]);

  const handleComplete = (taskId) => {
    // Update task status and navigate back
    localStorage.removeItem(`focus_task_${taskId}`);
    router.push("/app");
  };

  const handleClose = () => {
    router.push("/app");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <motion.div
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Task not found</p>
          <button
            onClick={() => router.push("/app")}
            className="px-6 py-3 rounded-xl bg-purple-500 text-white font-medium"
          >
            Go to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <FocusCard
      task={task}
      onComplete={handleComplete}
      onClose={handleClose}
    />
  );
}
