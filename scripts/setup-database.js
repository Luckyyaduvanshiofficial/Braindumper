/**
 * BrainDumper Database Setup Script
 * 
 * This script creates the required database, collections, and attributes
 * in Appwrite for the BrainDumper app.
 * 
 * Run with: node scripts/setup-database.js
 */

const { Client, Databases, ID, Permission, Role } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'braindumper-db';

// Collection configurations
const collections = {
  sessions: {
    id: 'sessions',
    name: 'Brain Dump Sessions',
    attributes: [
      { type: 'string', key: 'userId', size: 255, required: true },
      { type: 'string', key: 'title', size: 255, required: true },
      { type: 'string', key: 'rawDump', size: 65535, required: false },
      { type: 'string', key: 'summary', size: 5000, required: false },
      { type: 'string', key: 'sections', size: 65535, required: false }, // JSON string
      { type: 'string', key: 'insights', size: 10000, required: false }, // JSON string
      { type: 'string', key: 'currentFocus', size: 1000, required: false },
      { type: 'string', key: 'status', size: 50, required: false, default: 'active' },
      { type: 'datetime', key: 'createdAt', required: true },
      { type: 'datetime', key: 'updatedAt', required: true },
    ],
    indexes: [
      { key: 'userId_idx', type: 'key', attributes: ['userId'] },
      { key: 'createdAt_idx', type: 'key', attributes: ['createdAt'] },
    ],
  },
  tasks: {
    id: 'tasks',
    name: 'Tasks',
    attributes: [
      { type: 'string', key: 'userId', size: 255, required: true },
      { type: 'string', key: 'sessionId', size: 255, required: false },
      { type: 'string', key: 'title', size: 500, required: true },
      { type: 'string', key: 'description', size: 5000, required: false },
      { type: 'string', key: 'priority', size: 20, required: false, default: 'medium' },
      { type: 'string', key: 'bucket', size: 20, required: false, default: 'now' }, // now, next, later
      { type: 'string', key: 'status', size: 20, required: false, default: 'pending' }, // pending, in_progress, completed
      { type: 'integer', key: 'timeSpent', required: false, default: 0 }, // in minutes
      { type: 'datetime', key: 'createdAt', required: true },
      { type: 'datetime', key: 'updatedAt', required: true },
      { type: 'datetime', key: 'completedAt', required: false },
    ],
    indexes: [
      { key: 'userId_idx', type: 'key', attributes: ['userId'] },
      { key: 'sessionId_idx', type: 'key', attributes: ['sessionId'] },
      { key: 'status_idx', type: 'key', attributes: ['status'] },
      { key: 'bucket_idx', type: 'key', attributes: ['bucket'] },
    ],
  },
  activity: {
    id: 'activity',
    name: 'Activity Log',
    attributes: [
      { type: 'string', key: 'userId', size: 255, required: true },
      { type: 'string', key: 'type', size: 50, required: true }, // session_created, task_completed, etc.
      { type: 'string', key: 'description', size: 500, required: false },
      { type: 'datetime', key: 'createdAt', required: true },
    ],
    indexes: [
      { key: 'userId_idx', type: 'key', attributes: ['userId'] },
      { key: 'createdAt_idx', type: 'key', attributes: ['createdAt'] },
    ],
  },
  ideas: {
    id: 'ideas',
    name: 'Ideas',
    attributes: [
      { type: 'string', key: 'userId', size: 255, required: true },
      { type: 'string', key: 'title', size: 255, required: true },
      { type: 'string', key: 'rawInput', size: 65535, required: false },
      { type: 'string', key: 'generatedMarkdown', size: 65535, required: false },
      { type: 'datetime', key: 'createdAt', required: true },
      { type: 'datetime', key: 'updatedAt', required: true },
    ],
    indexes: [
      { key: 'userId_idx', type: 'key', attributes: ['userId'] },
      { key: 'createdAt_idx', type: 'key', attributes: ['createdAt'] },
    ],
  },
};

async function createDatabase() {
  try {
    console.log(`\n📦 Creating database: ${DATABASE_ID}...`);
    const db = await databases.create(DATABASE_ID, 'BrainDumper Database');
    console.log(`✅ Database created: ${db.$id}`);
    return db;
  } catch (error) {
    if (error.code === 409) {
      console.log(`ℹ️  Database ${DATABASE_ID} already exists`);
      return { $id: DATABASE_ID };
    }
    throw error;
  }
}

async function createCollection(collectionConfig) {
  const { id, name, attributes, indexes } = collectionConfig;
  
  try {
    console.log(`\n📁 Creating collection: ${name} (${id})...`);
    
    // Create collection with permissions
    const collection = await databases.createCollection(
      DATABASE_ID,
      id,
      name,
      [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
      true // Document security enabled
    );
    console.log(`✅ Collection created: ${collection.$id}`);

    // Create attributes
    for (const attr of attributes) {
      try {
        console.log(`   Adding attribute: ${attr.key} (${attr.type})...`);
        
        if (attr.type === 'string') {
          await databases.createStringAttribute(
            DATABASE_ID,
            id,
            attr.key,
            attr.size,
            attr.required,
            attr.default || null,
            false, // array
          );
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(
            DATABASE_ID,
            id,
            attr.key,
            attr.required,
            attr.min || null,
            attr.max || null,
            attr.default || null,
            false, // array
          );
        } else if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(
            DATABASE_ID,
            id,
            attr.key,
            attr.required,
            null, // default
            false, // array
          );
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(
            DATABASE_ID,
            id,
            attr.key,
            attr.required,
            attr.default || null,
            false, // array
          );
        }
        
        console.log(`   ✅ Attribute ${attr.key} created`);
      } catch (attrError) {
        if (attrError.code === 409) {
          console.log(`   ℹ️  Attribute ${attr.key} already exists`);
        } else {
          console.error(`   ❌ Failed to create attribute ${attr.key}:`, attrError.message);
        }
      }
    }

    // Wait for attributes to be available
    console.log(`   ⏳ Waiting for attributes to be ready...`);
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Create indexes
    for (const index of indexes || []) {
      try {
        console.log(`   Adding index: ${index.key}...`);
        await databases.createIndex(
          DATABASE_ID,
          id,
          index.key,
          index.type,
          index.attributes,
          index.orders || [],
        );
        console.log(`   ✅ Index ${index.key} created`);
      } catch (indexError) {
        if (indexError.code === 409) {
          console.log(`   ℹ️  Index ${index.key} already exists`);
        } else {
          console.error(`   ❌ Failed to create index ${index.key}:`, indexError.message);
        }
      }
    }

    return collection;
  } catch (error) {
    if (error.code === 409) {
      console.log(`ℹ️  Collection ${id} already exists`);
      return { $id: id };
    }
    throw error;
  }
}

async function main() {
  console.log('🚀 BrainDumper Database Setup');
  console.log('=============================');
  console.log(`Endpoint: ${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}`);
  console.log(`Project: ${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`);
  console.log(`Database: ${DATABASE_ID}`);

  try {
    // Create database
    await createDatabase();

    // Create collections
    for (const [key, config] of Object.entries(collections)) {
      await createCollection(config);
    }

    console.log('\n✅ Database setup complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Update your .env file with these collection IDs:');
    console.log(`   NEXT_PUBLIC_APPWRITE_DATABASE_ID="${DATABASE_ID}"`);
    console.log('   NEXT_PUBLIC_APPWRITE_COLLECTION_ID="ideas"');
    console.log('   NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID="sessions"');
    console.log('   NEXT_PUBLIC_APPWRITE_TASKS_COLLECTION_ID="tasks"');
    console.log('   NEXT_PUBLIC_APPWRITE_ACTIVITY_COLLECTION_ID="activity"');
    console.log('\n2. Restart your Next.js development server');
    console.log('\n3. Your dashboard should now show real statistics!');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
