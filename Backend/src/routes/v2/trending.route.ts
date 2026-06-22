import type { FastifyInstance } from "fastify";
import distributedRedisClient from "../../config/redis.js";

export default async function routes(fastify: FastifyInstance, options: any) {
    fastify.get("/", async (request, reply) => {
        try {
            // ZREVRANGE fetches the top N items sorted by highest score (most recent timestamp)
            // We get the top 10 most recently searched terms!
            const client = distributedRedisClient.getClientFor("trending:global");
            let trending: string[] = [];
            if (client) {
                trending = await client.zRange("trending:global", 0, 9, { REV: true });
            }

            return reply.status(200).send({
                message: "Trending Searches fetched successfully",
                data: trending
            });
        } catch (error) {
            console.error("Trending Route Error:", error);
            return reply.status(500).send({ error: "Failed to fetch trending searches" });
        }
    });
}
