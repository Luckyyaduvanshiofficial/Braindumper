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

export { client, account, databases, ID, Query };
