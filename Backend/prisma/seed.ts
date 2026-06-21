import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

// We have to recreate the Prisma connection specifically for the seed script
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌐 Downloading 10,000 English words dataset...");
  
  // 1. Download the dataset
  const response = await fetch("https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt");
  const text = await response.text();
  
  // 2. Split into an array of words
  const words = text.split("\n").filter(word => word.trim().length > 0);
  console.log(`✅ Successfully downloaded ${words.length} words!`);
  
  console.log("🧹 Clearing old database records...");
  await prisma.searchQuery.deleteMany({});
  
  console.log("⏳ Seeding database... This might take a few seconds.");
  
  // 3. Format the data for Prisma
  const seedData = words.map((word) => {
    return {
      query: word.trim(),
      // Assign a random popularity score between 1 and 500
      count: Math.floor(Math.random() * 500) + 1
    };
  });

  // 4. Bulk insert using createMany
  const result = await prisma.searchQuery.createMany({
    data: seedData,
    skipDuplicates: true // Just in case there are duplicates in the text file
  });

  console.log(`🎉 Success! Seeded ${result.count} words into the database.`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
