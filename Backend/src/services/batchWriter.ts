import prisma from "../config/db.js";
import distributedRedisClient from "../config/redis.js";
import { globalMetrics } from "../utils/metrics.js";

/*
  CRASH SCENARIO DOCUMENTATION:
  Since the BatchWriter stores search query counts in an in-memory Map buffer, 
  any data currently in the buffer will be PERMANENTLY LOST if the Node.js process 
  crashes or is restarted before a flush occurs.

  To fix this and ensure zero data loss:
  1. Write-Ahead Logging (WAL): Append every incoming search query to a local disk file immediately. On startup, replay the file.
  2. Persistent Queue (e.g., Kafka, RabbitMQ, or Redis Streams): Publish the search events to a persistent queue. 
     A separate worker or consumer can then read from the queue and perform the bulk upserts into Postgres.
     Redis Streams (XADD / XREAD) would be a lightweight way to achieve this using our existing infrastructure.
*/

export class BatchWriter {
    private buffer: Map<string, number> = new Map();
    private totalFlushed = 0;
    private writesAvoided = 0;
    private lastFlushAt: Date | null = null;
    private flushInterval: NodeJS.Timeout;

    constructor() {
        this.flushInterval = setInterval(() => this.flush(), 10000); // every 10s
    }

    public async addSearch(query: string) {
        const count = this.buffer.get(query) || 0;
        this.buffer.set(query, count + 1);

        // ZADD to trending:global immediately for recency signals
        const currentTimestampSec = Math.floor(Date.now() / 1000);
        await distributedRedisClient.zAdd("trending:global", currentTimestampSec, query);

        if (this.buffer.size >= 50) {
            this.flush(); // async flush
        }
    }

    public async flush() {
        if (this.buffer.size === 0) return;

        // Copy buffer and clear immediately to accept new requests
        const currentBuffer = new Map(this.buffer);
        this.buffer.clear();
        this.lastFlushAt = new Date();

        let totalQueries = 0;
        for (const val of currentBuffer.values()) {
            totalQueries += val;
        }

        const queriesInBatch = currentBuffer.size;
        const savedWrites = totalQueries - queriesInBatch;
        
        this.writesAvoided += savedWrites;
        globalMetrics.batchWritesAvoided = this.writesAvoided;

        try {
            const operations = Array.from(currentBuffer.entries()).map(([query, count]) =>
                prisma.searchQuery.upsert({
                    where: { query },
                    update: { count: { increment: count } },
                    create: { query, count }
                })
            );

            await prisma.$transaction(operations);
            this.totalFlushed += queriesInBatch;
            console.log(`[BatchWriter] Batch flushed: ${queriesInBatch} queries, ${savedWrites} total writes saved`);
        } catch (err) {
            console.error("[BatchWriter] Flush failed. Data lost for batch:", err);
            // In a robust system, we would put them back in the buffer or a dead-letter queue.
        }
    }

    public getStats() {
        return {
            bufferSize: this.buffer.size,
            totalFlushed: this.totalFlushed,
            writesAvoided: this.writesAvoided,
            lastFlushAt: this.lastFlushAt
        };
    }
}

export const searchBatchWriter = new BatchWriter();
