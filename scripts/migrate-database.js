/**
 * BrainDumper Database Migration Script
 * 
 * This script adds missing attributes to existing collections.
 * Run with: node scripts/migrate-database.js
 */

const { Client, Databases, ID } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'braindumper-db';

async function addAttributeIfMissing(collectionId, attributeName, createFn) {
  try {
    // Try to create the attribute
    await createFn();
    console.log(`✅ Added attribute '${attributeName}' to '${collectionId}'`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`ℹ️  Attribute '${attributeName}' already exists in '${collectionId}'`);
    } else {
      console.error(`❌ Failed to add '${attributeName}' to '${collectionId}':`, error.message);
    }
  }
}

async function migrateSessionsCollection() {
  console.log('\n📁 Migrating sessions collection...');
  
  await addAttributeIfMissing('sessions', 'userId', () =>
    databases.createStringAttribute(DATABASE_ID, 'sessions', 'userId', 255, true)
  );
  
  await addAttributeIfMissing('sessions', 'title', () =>
    databases.createStringAttribute(DATABASE_ID, 'sessions', 'title', 255, true)
  );
  
  await addAttributeIfMissing('sessions', 'rawDump', () =>
    databases.createStringAttribute(DATABASE_ID, 'sessions', 'rawDump', 65535, false)
  );
  
  await addAttributeIfMissing('sessions', 'summary', () =>
    databases.createStringAttribute(DATABASE_ID, 'sessions', 'summary', 5000, false)
  );
  
  await addAttributeIfMissing('sessions', 'sections', () =>
    databases.createStringAttribute(DATABASE_ID, 'sessions', 'sections', 65535, false)
  );
  
  await addAttributeIfMissing('sessions', 'insights', () =>
    databases.createStringAttribute(DATABASE_ID, 'sessions', 'insights', 10000, false)
  );
  
  await addAttributeIfMissing('sessions', 'currentFocus', () =>
    databases.createStringAttribute(DATABASE_ID, 'sessions', 'currentFocus', 1000, false)
  );
  
  await addAttributeIfMissing('sessions', 'status', () =>
    databases.createStringAttribute(DATABASE_ID, 'sessions', 'status', 50, false, 'active')
  );
  
  await addAttributeIfMissing('sessions', 'createdAt', () =>
    databases.createDatetimeAttribute(DATABASE_ID, 'sessions', 'createdAt', true)
  );
  
  await addAttributeIfMissing('sessions', 'updatedAt', () =>
    databases.createDatetimeAttribute(DATABASE_ID, 'sessions', 'updatedAt', true)
  );
}

async function migrateTasksCollection() {
  console.log('\n📁 Migrating tasks collection...');
  
  await addAttributeIfMissing('tasks', 'userId', () =>
    databases.createStringAttribute(DATABASE_ID, 'tasks', 'userId', 255, true)
  );
  
  await addAttributeIfMissing('tasks', 'sessionId', () =>
    databases.createStringAttribute(DATABASE_ID, 'tasks', 'sessionId', 255, false)
  );
  
  await addAttributeIfMissing('tasks', 'title', () =>
    databases.createStringAttribute(DATABASE_ID, 'tasks', 'title', 500, true)
  );
  
  await addAttributeIfMissing('tasks', 'description', () =>
    databases.createStringAttribute(DATABASE_ID, 'tasks', 'description', 5000, false)
  );
  
  await addAttributeIfMissing('tasks', 'priority', () =>
    databases.createStringAttribute(DATABASE_ID, 'tasks', 'priority', 20, false, 'medium')
  );
  
  await addAttributeIfMissing('tasks', 'bucket', () =>
    databases.createStringAttribute(DATABASE_ID, 'tasks', 'bucket', 20, false, 'now')
  );
  
  await addAttributeIfMissing('tasks', 'status', () =>
    databases.createStringAttribute(DATABASE_ID, 'tasks', 'status', 20, false, 'pending')
  );
  
  await addAttributeIfMissing('tasks', 'timeSpent', () =>
    databases.createIntegerAttribute(DATABASE_ID, 'tasks', 'timeSpent', false, 0, 999999, 0)
  );
  
  await addAttributeIfMissing('tasks', 'createdAt', () =>
    databases.createDatetimeAttribute(DATABASE_ID, 'tasks', 'createdAt', true)
  );
  
  await addAttributeIfMissing('tasks', 'updatedAt', () =>
    databases.createDatetimeAttribute(DATABASE_ID, 'tasks', 'updatedAt', true)
  );
  
  await addAttributeIfMissing('tasks', 'completedAt', () =>
    databases.createDatetimeAttribute(DATABASE_ID, 'tasks', 'completedAt', false)
  );
}

async function migrateActivityCollection() {
  console.log('\n📁 Migrating activity collection...');
  
  await addAttributeIfMissing('activity', 'userId', () =>
    databases.createStringAttribute(DATABASE_ID, 'activity', 'userId', 255, true)
  );
  
  await addAttributeIfMissing('activity', 'type', () =>
    databases.createStringAttribute(DATABASE_ID, 'activity', 'type', 50, true)
  );
  
  await addAttributeIfMissing('activity', 'description', () =>
    databases.createStringAttribute(DATABASE_ID, 'activity', 'description', 500, false)
  );
  
  await addAttributeIfMissing('activity', 'createdAt', () =>
    databases.createDatetimeAttribute(DATABASE_ID, 'activity', 'createdAt', true)
  );
}

async function migrateIdeasCollection() {
  console.log('\n📁 Migrating ideas collection...');
  
  await addAttributeIfMissing('ideas', 'userId', () =>
    databases.createStringAttribute(DATABASE_ID, 'ideas', 'userId', 255, true)
  );
  
  await addAttributeIfMissing('ideas', 'title', () =>
    databases.createStringAttribute(DATABASE_ID, 'ideas', 'title', 255, true)
  );
  
  await addAttributeIfMissing('ideas', 'rawInput', () =>
    databases.createStringAttribute(DATABASE_ID, 'ideas', 'rawInput', 65535, false)
  );
  
  await addAttributeIfMissing('ideas', 'generatedMarkdown', () =>
    databases.createStringAttribute(DATABASE_ID, 'ideas', 'generatedMarkdown', 65535, false)
  );
  
  await addAttributeIfMissing('ideas', 'createdAt', () =>
    databases.createDatetimeAttribute(DATABASE_ID, 'ideas', 'createdAt', true)
  );
  
  await addAttributeIfMissing('ideas', 'updatedAt', () =>
    databases.createDatetimeAttribute(DATABASE_ID, 'ideas', 'updatedAt', true)
  );
}

async function main() {
  console.log('🚀 BrainDumper Database Migration');
  console.log('==================================');
  console.log(`Database: ${DATABASE_ID}`);

  try {
    await migrateSessionsCollection();
    await migrateTasksCollection();
    await migrateActivityCollection();
    await migrateIdeasCollection();

    console.log('\n✅ Migration complete!');
    console.log('\nNote: Wait a few seconds for attributes to be ready before using the app.');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

main();
