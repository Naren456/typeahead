import type { FastifyRequest, FastifyReply } from "fastify";

interface NodeMetrics {
    hits: number;
    misses: number;
}

export const globalMetrics = {
    latencies: [] as number[],
    cacheStats: new Map<string, NodeMetrics>(),
    batchWritesAvoided: 0
};

// Circular buffer logic for last 1000 requests
export const addLatency = (latency: number) => {
    globalMetrics.latencies.push(latency);
    if (globalMetrics.latencies.length > 1000) {
        globalMetrics.latencies.shift();
    }
};

export const recordCacheResult = (node: string, hit: boolean) => {
    if (!node) return;
    let stats = globalMetrics.cacheStats.get(node);
    if (!stats) {
        stats = { hits: 0, misses: 0 };
        globalMetrics.cacheStats.set(node, stats);
    }
    if (hit) {
        stats.hits++;
    } else {
        stats.misses++;
    }
};

export const getPercentile = (percentile: number) => {
    if (globalMetrics.latencies.length === 0) return 0;
    const sorted = [...globalMetrics.latencies].sort((a, b) => a - b);
    const index = Math.floor((percentile / 100) * sorted.length);
    return sorted[index];
};

export const getMetricsReport = () => {
    const p50 = getPercentile(50);
    const p95 = getPercentile(95);

    let totalHits = 0;
    let totalMisses = 0;
    const per_node: Record<string, { hits: number; misses: number; hit_rate: number }> = {};

    for (const [node, stats] of globalMetrics.cacheStats.entries()) {
        totalHits += stats.hits;
        totalMisses += stats.misses;
        const total = stats.hits + stats.misses;
        per_node[node] = {
            hits: stats.hits,
            misses: stats.misses,
            hit_rate: total > 0 ? Number((stats.hits / total).toFixed(2)) : 0
        };
    }

    const totalRequests = totalHits + totalMisses;
    const cache_hit_rate_overall = totalRequests > 0 ? Number((totalHits / totalRequests).toFixed(2)) : 0;

    return {
        p50_latency_ms: p50,
        p95_latency_ms: p95,
        cache_hit_rate_overall,
        per_node,
        batch_writes_avoided: globalMetrics.batchWritesAvoided
    };
};
