import prisma from "../config/db.js";

export const saveSearchQuery = async (query: string) => {
    return await prisma.searchQuery.upsert({
        where: { query: query.toLowerCase() },
        update: { count: { increment: 1 } },
        create: { query: query.toLowerCase(), count: 1 }
    });
};
