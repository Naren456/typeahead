import type { FastifyInstance } from "fastify";
import { getSuggestions } from "../../services/suggestion.service.js";
import distributedRedisClient from "../../config/redis.js";

export default async function routes(fastify: FastifyInstance, options: any) {
    fastify.get("/", async (request, reply) => {
        const queryParams = request.query as any;
        const q = queryParams.q as string;
        const mode = queryParams.mode as string;
        if (!q) return reply.send([]);

        const targetNodeUrl = distributedRedisClient.getNodeUrlFor(q.toLowerCase());
        (request as any).node = targetNodeUrl; // for metrics

        try {
            const cachedData = await distributedRedisClient.get(q.toLowerCase());
            if (cachedData) {
                (request as any).cacheHit = true;
                return reply.status(200).send({ message: "cache hit (v2)", data: JSON.parse(cachedData) });
            }

            (request as any).cacheHit = false;
            const suggestion = await getSuggestions(q, mode);
            
            await distributedRedisClient.setEx(q.toLowerCase(), 60, JSON.stringify(suggestion));

            return reply.status(200).send({ message: "search suggestions (v2)", data: suggestion });
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: "failed to fetch suggestion" });
        }
    });
}
