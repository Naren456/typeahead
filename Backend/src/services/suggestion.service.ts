import prisma from "../config/db.js";
import distributedRedisClient from "../config/redis.js";

export const getSuggestions = async (q: string, mode: string = "") => {
    const results = await prisma.searchQuery.findMany({
        where: { query: { startsWith: q.toLowerCase() } },
        orderBy: { count: 'desc' },
        take: 20 
    });

    if (mode === "basic") {
        return results.slice(0, 10).map((r: { query: string; count: any }) => ({
            query: r.query,
            count: Number(r.count),
            raw_count: Number(r.count),
            trending_score: Number(r.count)
        }));
    }

    const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
    const now = Math.floor(Date.now() / 1000);

    // Get recency data from redis
    type SearchRecord = { query: string; count: any };
    type ScoredResult = { query: string; raw_count: number; recency_boost: number; trending_score: number };

    const scoredResults: ScoredResult[] = await Promise.all(results.map(async (r: SearchRecord) => {
        const raw_count = Number(r.count);
        let recency_boost = 0;
        try {
            // Count how many times this exact query was searched in the last hour
            // Note: Since ZCOUNT is not implemented in our wrapper, let's use zRange and count.
            const client = distributedRedisClient.getClientFor("trending:global");
            if (client) {
                 const recentSearches = await client.zRange("trending:global", String(oneHourAgo), String(now), { BY: "SCORE" });
                 // Filter for this specific query
                 recency_boost = recentSearches.filter((search: string) => search === r.query).length;
            }
        } catch (e) {
            console.error("Failed to get recency boost", e);
        }

        const trending_score = raw_count * 0.6 + recency_boost * 0.4;
        return {
            query: r.query,
            raw_count,
            recency_boost,
            trending_score
        };
    }));

    // Sort by trending score descending
    scoredResults.sort((a: ScoredResult, b: ScoredResult) => b.trending_score - a.trending_score);
    
    return scoredResults.slice(0, 10);
};
