import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import { addLatency, recordCacheResult } from "./utils/metrics.js";
dotenv.config();

const app = Fastify();

// The "Final Boss" BigInt Fix!
// This tells JavaScript how to automatically convert Prisma BigInts into JSON strings
(BigInt.prototype as any).toJSON = function () {
    return Number(this);
};

app.register(cors, { origin: "*" });

// Fastify hook (onResponse) that logs: { route, latencyMs, cacheHit: boolean, node: string } as JSON
app.addHook("onResponse", (request, reply, done) => {
    const latencyMs = reply.elapsedTime;
    addLatency(latencyMs);
    
    // We expect routes to attach these to the request object if applicable
    const cacheHit = (request as any).cacheHit ?? false;
    const node = (request as any).node ?? "none";
    
    // only record cache hits/misses for routes that involve cache
    if ((request as any).node) {
        recordCacheResult(node, cacheHit);
    }
    
    console.log(JSON.stringify({
        route: request.routeOptions.url || request.url,
        latencyMs: Math.round(latencyMs),
        cacheHit,
        node
    }));
    
    done();
});

import v1Router from "./routes/v1/index.js";
import v2Router from "./routes/v2/index.js";

app.register(v1Router, { prefix: "/api/v1" });
app.register(v2Router, { prefix: "/api/v2" });

// We export the app here instead of listening, so our tests can import it!
export default app;