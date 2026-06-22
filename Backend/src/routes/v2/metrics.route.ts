import type { FastifyInstance } from "fastify";
import { getMetricsReport } from "../../utils/metrics.js";

export default async function routes(fastify: FastifyInstance, options: any) {
    fastify.get("/", async (request, reply) => {
        try {
            const stats = getMetricsReport();
            return reply.send(stats);
        } catch (error) {
            console.error("Metrics Route Error:", error);
            return reply.status(500).send({ error: "Failed to fetch metrics" });
        }
    });
}
