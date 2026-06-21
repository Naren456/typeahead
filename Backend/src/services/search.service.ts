import prisma from "../config/db.js";

import distributedRedisClient from "../config/redis.js";

const searchQueue: string[] = [];

export const saveSearchQuery = async (query: string) => {
    const q = query.toLowerCase();
    searchQueue.push(q);
    
    // Save to Redis Sorted Set with Unix timestamp for "Trending Searches"
    await distributedRedisClient.zAdd("trending_searches", Date.now(), q);
    
    return { success: true, queued: true };
};

setInterval(async () => {
    if (searchQueue.length === 0) return;

    const batch = [...searchQueue];
    searchQueue.length = 0; 

    const counts: Record<string, number> = {};
    for (const q of batch) {
        counts[q] = (counts[q] || 0) + 1;
    }

    try {
        const operations = Object.entries(counts).map(([query, count]) => 
            prisma.searchQuery.upsert({
                where: { query },
                update: { count: { increment: count } },
                create: { query, count }
            })
        );
        
        await prisma.$transaction(operations);
        console.log(`[Batch Worker] Successfully saved ${batch.length} searches to PostgreSQL!`);
    } catch (err) {
        console.error("[Batch Worker] Failed to save batch:", err);
        searchQueue.push(...batch);
    }
}, 5000);
