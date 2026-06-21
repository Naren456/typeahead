import { createClient } from "redis";
import "dotenv/config";

console.log("DOCKER ENV REDIS_URLS:", process.env.REDIS_URLS);

const redisUrls = process.env.REDIS_URLS
    ? process.env.REDIS_URLS.split(",")
    : ["redis://localhost:6379"];

console.log("PARSED URLS:", redisUrls);

const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
});


redisClient.on("error", (err) => console.error("Redis Client Error", err));

redisClient.on("connect", () => console.log("Connected to Redis!"));

try {
    await redisClient.connect();
} catch (error) {
    console.error("Failed to connect to Redis initially:", error);
}

export default redisClient;