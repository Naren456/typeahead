import type { FastifyInstance } from "fastify";
import { searchBatchWriter } from "../../services/batchWriter.js";

export default async function routes(fastify: FastifyInstance, options: any) {
    fastify.get("/stats", async (request, reply) => {
        try {
            const stats = searchBatchWriter.getStats();
            return reply.send(stats);
        } catch (error) {
            console.error("Batch Stats Error:", error);
            return reply.status(500).send({ error: "Failed to fetch batch stats" });
        }
    });
}
