import distributedRedisClient from "../config/redis.js";
import { searchBatchWriter } from "./batchWriter.js";

export const saveSearchQuery = async (query: string) => {
    const q = query.toLowerCase();
    
    // Invalidate the cache for this exact query (if it was cached as a prefix)
    const targetNodeUrl = distributedRedisClient.getNodeUrlFor(q);
    const client = distributedRedisClient.getClientFor(q);
    if (client) {
        await client.del(q).catch(console.error);
    }
    
    // Add to BatchWriter instead of local array queue
    await searchBatchWriter.addSearch(q);
    
    return { success: true, queued: true };
};
