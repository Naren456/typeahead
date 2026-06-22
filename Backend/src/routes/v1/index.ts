import type { FastifyInstance } from "fastify";
import searchRoute from "./search.route.js";
import suggestionRoute from "./suggestion.route.js";

export default async function routes(fastify: FastifyInstance, options: any) {
    fastify.register(searchRoute, { prefix: "/search" });
    fastify.register(suggestionRoute, { prefix: "/suggest" });
}
