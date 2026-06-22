import type { FastifyInstance } from "fastify";
import distributedRedisClient from "../../config/redis.js";

export default async function routes(fastify: FastifyInstance, options: any) {
    fastify.get("/debug", async (request, reply) => {
        const prefix = (request.query as any).prefix as string;
        
        if (!prefix) {
            return reply.status(400).send({ error: "?prefix= query parameter is required" });
        }

        // Call our ConsistentHash ring to find out EXACTLY which Redis node owns this word
        const targetNode = distributedRedisClient.getNodeUrlFor(prefix.toLowerCase());
        
        // Check if there is a cache hit
        let hit = false;
        try {
            const cachedData = await distributedRedisClient.get(prefix.toLowerCase());
            hit = !!cachedData;
        } catch (e) {
            // handle error
        }

        let nodeName = targetNode;
        let port = 6379;
        try {
            const parsedUrl = new URL(targetNode);
            port = parseInt(parsedUrl.port || "6379");
            nodeName = `redis-${port - 6379 + 1}`; // e.g. 6379 -> redis-1, 6380 -> redis-2
        } catch(e) {}
        
        return reply.send({
            node: nodeName,
            port: port,
            hit: hit
        });
    });
}
