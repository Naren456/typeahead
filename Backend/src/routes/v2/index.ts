import type { FastifyInstance } from "fastify";
import suggestionRoute from "./suggestion.route.js";
import searchRoute from "../v1/search.route.js";
import cacheRoute from "./cache.route.js";
import trendingRoute from "./trending.route.js";
import batchRoute from "./batch.route.js";
import metricsRoute from "./metrics.route.js";

export default async function routes(fastify: FastifyInstance, options: any) {
    fastify.register(suggestionRoute, { prefix: "/suggest" });
    fastify.register(searchRoute, { prefix: "/search" });
    fastify.register(cacheRoute, { prefix: "/cache" });
    fastify.register(trendingRoute, { prefix: "/trending" });
    fastify.register(batchRoute, { prefix: "/batch" });
    fastify.register(metricsRoute, { prefix: "/metrics" });
}
