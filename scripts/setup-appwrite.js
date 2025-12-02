const sdk = require("node-appwrite");

// Initialize the Appwrite client
const client = new sdk.Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("692e588800379b086260")
  .setKey("standard_af0bf9985fa1127e6e73d2e9b17dece4d1c8c7538be67d1bfeb67c852fbd5f998f7e06b36e934b4b0eed90fdd600801b2bfcdade6a608bde113a3290f5fad285bf04dfd2483aa1b839cc18371ce7a9b07c3c767279d29ab5e70712f4fd40393986b7d3d9ac469b35bb71b176efeaacbfa47b90913b9f9ba9a86eabc99abd9a09");

const databases = new sdk.Databases(client);

const DATABASE_ID = "braindumper-db";
const COLLECTION_ID = "ideas";

async function setup() {
  try {
    console.log("🚀 Setting up Appwrite Database...\n");

    // Step 1: Create Database
    console.log("1️⃣ Creating database...");
    try {
      await databases.create(DATABASE_ID, "Brain Dumper Database");
      console.log("   ✅ Database created: braindumper-db");
    } catch (error) {
      if (error.code === 409) {
        console.log("   ⚠️ Database already exists, skipping...");
      } else {
        throw error;
      }
    }

    // Step 2: Create Collection
    console.log("\n2️⃣ Creating collection...");
    try {
      await databases.createCollection(
        DATABASE_ID,
        COLLECTION_ID,
        "Ideas",
        [
          sdk.Permission.create(sdk.Role.users()),
          sdk.Permission.read(sdk.Role.users()),
          sdk.Permission.update(sdk.Role.users()),
          sdk.Permission.delete(sdk.Role.users()),
        ],
        true // Document security enabled
      );
      console.log("   ✅ Collection created: ideas");
    } catch (error) {
      if (error.code === 409) {
        console.log("   ⚠️ Collection already exists, skipping...");
      } else {
        throw error;
      }
    }

    // Step 3: Create Attributes
    console.log("\n3️⃣ Creating attributes...");

    const attributes = [
      { key: "title", size: 500, required: true },
      { key: "rawInput", size: 50000, required: true },
      { key: "generatedMarkdown", size: 100000, required: true },
      { key: "userId", size: 50, required: true },
      { key: "createdAt", size: 30, required: true },
      { key: "updatedAt", size: 30, required: true },
      { key: "language", size: 50, required: false, default: "en" },
    ];

    for (const attr of attributes) {
      try {
        await databases.createStringAttribute(
          DATABASE_ID,
          COLLECTION_ID,
          attr.key,
          attr.size,
          attr.required,
          attr.default || null,
          false // not array
        );
        console.log(`   ✅ Attribute created: ${attr.key}`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`   ⚠️ Attribute ${attr.key} already exists, skipping...`);
        } else {
          console.log(`   ❌ Failed to create ${attr.key}: ${error.message}`);
        }
      }
    }

    // Wait for attributes to be ready
    console.log("\n⏳ Waiting for attributes to be processed...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Step 4: Create Indexes
    console.log("\n4️⃣ Creating indexes...");

    try {
      await databases.createIndex(
        DATABASE_ID,
        COLLECTION_ID,
        "userId_index",
        sdk.IndexType.Key,
        ["userId"]
      );
      console.log("   ✅ Index created: userId_index");
    } catch (error) {
      if (error.code === 409) {
        console.log("   ⚠️ Index userId_index already exists, skipping...");
      } else {
        console.log(`   ❌ Failed to create index: ${error.message}`);
      }
    }

    try {
      await databases.createIndex(
        DATABASE_ID,
        COLLECTION_ID,
        "createdAt_index",
        sdk.IndexType.Key,
        ["createdAt"],
        ["DESC"]
      );
      console.log("   ✅ Index created: createdAt_index");
    } catch (error) {
      if (error.code === 409) {
        console.log("   ⚠️ Index createdAt_index already exists, skipping...");
      } else {
        console.log(`   ❌ Failed to create index: ${error.message}`);
      }
    }

    console.log("\n🎉 Appwrite setup complete!");
    console.log("\n📋 Summary:");
    console.log("   Database ID: braindumper-db");
    console.log("   Collection ID: ideas");
    console.log("   Attributes: title, rawInput, generatedMarkdown, userId, createdAt, updatedAt, language");
    console.log("   Indexes: userId_index, createdAt_index");

  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
    process.exit(1);
  }
}

setup();
