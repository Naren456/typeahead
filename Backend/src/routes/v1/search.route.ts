import type { FastifyInstance } from "fastify";
import { saveSearchQuery } from "../../services/search.service.js";

export default async function routes(fastify: FastifyInstance, options: any) {
    fastify.post("/", async (request, reply) => {
        const { query } = request.body as any;
        if (!query) return reply.status(400).send({ error: "Query is required" });

        try {
            const result = await saveSearchQuery(query);
            return reply.send({ message: "Searched", data: result });
        } catch (error) {
            return reply.status(500).send({ error: "Failed to save search query" });
        }
    });
}
