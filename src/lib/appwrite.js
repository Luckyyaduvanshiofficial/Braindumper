import { Client, Account, Databases, ID, Query, OAuthProvider } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);

// Google OAuth login
export function loginWithGoogle() {
  account.createOAuth2Session(
    OAuthProvider.Google,
    window.location.origin, // Success redirect
    window.location.origin  // Failure redirect
  );
}

// Database constants
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID;

// Collection IDs for BrainDumper
const SESSIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID || "sessions";
const TASKS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_TASKS_COLLECTION_ID || "tasks";
const ACTIVITY_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ACTIVITY_COLLECTION_ID || "activity";

// Auth functions
export async function createAccount(email, password, name) {
  try {
    const user = await account.create(ID.unique(), email, password, name);
    // Auto login after signup
    await login(email, password);
    return user;
  } catch (error) {
    console.error("Create account error:", error);
    throw error;
  }
}

export async function login(email, password) {
  try {
    const session = await account.createEmailPasswordSession(email, password);
    return session;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

export async function logout() {
  try {
    await account.deleteSession("current");
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const user = await account.get();
    return user;
  } catch (error) {
    return null;
  }
}

// Ideas CRUD functions
export async function createIdea(title, rawInput, generatedMarkdown, userId) {
  try {
    const document = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      {
        title,
        rawInput,
        generatedMarkdown,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
    return document;
  } catch (error) {
    console.error("Create idea error:", error);
    throw error;
  }
}

export async function getIdeas(userId) {
  try {
    const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.orderDesc("createdAt"),
      Query.limit(50),
    ]);
    return response.documents;
  } catch (error) {
    console.error("Get ideas error:", error);
    throw error;
  }
}

export async function getIdea(ideaId) {
  try {
    const document = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ideaId
    );
    return document;
  } catch (error) {
    console.error("Get idea error:", error);
    throw error;
  }
}

export async function updateIdea(ideaId, updates) {
  try {
    const document = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ideaId,
      {
        ...updates,
        updatedAt: new Date().toISOString(),
      }
    );
    return document;
  } catch (error) {
    console.error("Update idea error:", error);
    throw error;
  }
}

export async function deleteIdea(ideaId) {
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, ideaId);
  } catch (error) {
    console.error("Delete idea error:", error);
    throw error;
  }
}

// ============== BRAIN DUMP SESSIONS ==============

export async function createSession(userId, title, rawDump, aiResult) {
  try {
    const document = await databases.createDocument(
      DATABASE_ID,
      SESSIONS_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        title: title || "Brain Dump Session",
        rawDump: rawDump?.substring(0, 65000) || "", // Limit size
        sections: JSON.stringify(aiResult?.sections || []).substring(0, 65000),
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
    
    // Log activity
    await logActivity(userId, "session_created", `Created brain dump: ${title || "Untitled"}`);
    
    return document;
  } catch (error) {
    console.error("Create session error:", error);
    throw error;
  }
}

export async function getSessions(userId, limit = 50) {
  try {
    const response = await databases.listDocuments(DATABASE_ID, SESSIONS_COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.orderDesc("createdAt"),
      Query.limit(limit),
    ]);
    return response.documents;
  } catch (error) {
    console.error("Get sessions error:", error);
    throw error;
  }
}

export async function getSession(sessionId) {
  try {
    const document = await databases.getDocument(
      DATABASE_ID,
      SESSIONS_COLLECTION_ID,
      sessionId
    );
    return document;
  } catch (error) {
    console.error("Get session error:", error);
    throw error;
  }
}

export async function updateSession(sessionId, updates) {
  try {
    const document = await databases.updateDocument(
      DATABASE_ID,
      SESSIONS_COLLECTION_ID,
      sessionId,
      {
        ...updates,
        updatedAt: new Date().toISOString(),
      }
    );
    return document;
  } catch (error) {
    console.error("Update session error:", error);
    throw error;
  }
}

export async function deleteSession(sessionId) {
  try {
    await databases.deleteDocument(DATABASE_ID, SESSIONS_COLLECTION_ID, sessionId);
  } catch (error) {
    console.error("Delete session error:", error);
    throw error;
  }
}

// ============== TASKS ==============

export async function createTask(userId, sessionId, taskData) {
  try {
    const document = await databases.createDocument(
      DATABASE_ID,
      TASKS_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        sessionId: sessionId || "",
        title: taskData.title,
        description: taskData.description || "",
        priority: taskData.priority || "medium",
        bucket: taskData.bucket || "now", // now, next, later
        status: "pending", // pending, in_progress, completed
        timeSpent: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: "",
      }
    );
    return document;
  } catch (error) {
    console.error("Create task error:", error);
    throw error;
  }
}

export async function getTasks(userId, filters = {}) {
  try {
    const queries = [
      Query.equal("userId", userId),
      Query.orderDesc("createdAt"),
      Query.limit(100),
    ];
    
    if (filters.sessionId) {
      queries.push(Query.equal("sessionId", filters.sessionId));
    }
    if (filters.status) {
      queries.push(Query.equal("status", filters.status));
    }
    if (filters.bucket) {
      queries.push(Query.equal("bucket", filters.bucket));
    }
    
    const response = await databases.listDocuments(DATABASE_ID, TASKS_COLLECTION_ID, queries);
    return response.documents;
  } catch (error) {
    console.error("Get tasks error:", error);
    throw error;
  }
}

export async function updateTask(taskId, updates, userId) {
  try {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    // If task is being completed, log it
    if (updates.status === "completed" && !updates.completedAt) {
      updateData.completedAt = new Date().toISOString();
      if (userId) {
        await logActivity(userId, "task_completed", `Completed task: ${updates.title || "Untitled"}`);
      }
    }
    
    const document = await databases.updateDocument(
      DATABASE_ID,
      TASKS_COLLECTION_ID,
      taskId,
      updateData
    );
    return document;
  } catch (error) {
    console.error("Update task error:", error);
    throw error;
  }
}

export async function deleteTask(taskId) {
  try {
    await databases.deleteDocument(DATABASE_ID, TASKS_COLLECTION_ID, taskId);
  } catch (error) {
    console.error("Delete task error:", error);
    throw error;
  }
}

// ============== ACTIVITY LOG ==============

export async function logActivity(userId, type, description) {
  try {
    const document = await databases.createDocument(
      DATABASE_ID,
      ACTIVITY_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        type, // session_created, task_completed, idea_created, focus_started, etc.
        description,
        createdAt: new Date().toISOString(),
      }
    );
    return document;
  } catch (error) {
    console.error("Log activity error:", error);
    // Don't throw - activity logging shouldn't break the app
    return null;
  }
}

export async function getActivity(userId, limit = 20) {
  try {
    const response = await databases.listDocuments(DATABASE_ID, ACTIVITY_COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.orderDesc("createdAt"),
      Query.limit(limit),
    ]);
    return response.documents;
  } catch (error) {
    console.error("Get activity error:", error);
    throw error;
  }
}

// ============== DASHBOARD STATISTICS ==============

export async function getDashboardStats(userId) {
  try {
    // Fetch all data in parallel
    const [sessionsResponse, tasksResponse, ideasResponse, activityResponse] = await Promise.all([
      databases.listDocuments(DATABASE_ID, SESSIONS_COLLECTION_ID, [
        Query.equal("userId", userId),
        Query.limit(1000),
      ]),
      databases.listDocuments(DATABASE_ID, TASKS_COLLECTION_ID, [
        Query.equal("userId", userId),
        Query.limit(1000),
      ]),
      databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.equal("userId", userId),
        Query.limit(1000),
      ]),
      databases.listDocuments(DATABASE_ID, ACTIVITY_COLLECTION_ID, [
        Query.equal("userId", userId),
        Query.orderDesc("createdAt"),
        Query.limit(20),
      ]),
    ]);

    const sessions = sessionsResponse.documents;
    const tasks = tasksResponse.documents;
    const ideas = ideasResponse.documents;
    const recentActivity = activityResponse.documents;

    // Calculate stats
    const totalSessions = sessions.length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const pendingTasks = tasks.filter(t => t.status === "pending").length;
    const inProgressTasks = tasks.filter(t => t.status === "in_progress").length;
    const totalIdeas = ideas.length;
    
    // Calculate task distribution by bucket
    const nowTasks = tasks.filter(t => t.bucket === "now").length;
    const nextTasks = tasks.filter(t => t.bucket === "next").length;
    const laterTasks = tasks.filter(t => t.bucket === "later").length;
    
    // Calculate total time spent on tasks (in minutes)
    const totalTimeSpent = tasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
    
    // Calculate streak (days with at least one session)
    const streakDays = calculateStreak(sessions);
    
    // Get this week's stats
    const thisWeekStart = getStartOfWeek();
    const thisWeekSessions = sessions.filter(s => new Date(s.createdAt) >= thisWeekStart).length;
    const thisWeekTasks = tasks.filter(t => new Date(t.createdAt) >= thisWeekStart).length;
    const thisWeekCompleted = tasks.filter(t => 
      t.status === "completed" && 
      t.completedAt && 
      new Date(t.completedAt) >= thisWeekStart
    ).length;

    return {
      totalSessions,
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      totalIdeas,
      nowTasks,
      nextTasks,
      laterTasks,
      totalTimeSpent,
      streakDays,
      thisWeekSessions,
      thisWeekTasks,
      thisWeekCompleted,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      recentActivity,
      recentSessions: sessions.slice(0, 5),
      recentIdeas: ideas.slice(0, 5),
    };
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    throw error;
  }
}

function calculateStreak(sessions) {
  if (sessions.length === 0) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Sort sessions by date (most recent first)
  const sortedDates = [...new Set(
    sessions.map(s => {
      const date = new Date(s.createdAt);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
  )].sort((a, b) => b - a);
  
  let streak = 0;
  let currentDate = today.getTime();
  
  for (const sessionDate of sortedDates) {
    if (sessionDate === currentDate || sessionDate === currentDate - 86400000) {
      streak++;
      currentDate = sessionDate;
    } else {
      break;
    }
  }
  
  return streak;
}

function getStartOfWeek() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

export { client, account, databases, ID, Query };
