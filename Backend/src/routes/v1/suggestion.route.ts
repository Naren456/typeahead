import type { FastifyInstance } from "fastify";
import { getSuggestions } from "../../services/suggestion.service.js";

export default async function routes(fastify: FastifyInstance, options: any) {
    fastify.get("/", async (request, reply) => {
        const q = (request.query as any).q as string;
        if (!q) return reply.send([]);

        try {
            const suggestion = await getSuggestions(q);
            return reply.status(200).send({ message: "search suggestions (v1)", data: suggestion });
        } catch (error) {
            return reply.status(500).send({ error: "failed to fetch suggestion" });
        }
    });
}
