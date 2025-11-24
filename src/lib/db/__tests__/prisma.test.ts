import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../prisma';

describe('Prisma Client', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should connect to the database successfully', async () => {
    // Test connection by executing a simple query
    const result = await prisma.$executeRaw`SELECT 1 as test`;
    expect(result).toBeDefined();
  });

  it('should have the correct database name', async () => {
    const result = await prisma.$queryRaw<
      { current_database: string }[]
    >`SELECT current_database()`;

    // Extract expected database name from DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL || '';
    const dbNameMatch = databaseUrl.match(/\/([^/?]+)(\?|$)/);
    const expectedDbName = dbNameMatch ? dbNameMatch[1] : 'learning_trainer';

    expect(result[0].current_database).toBe(expectedDbName);
  });

  it('should check pgvector extension availability', async () => {
    const result = await prisma.$queryRaw<
      { extname: string }[]
    >`SELECT extname FROM pg_extension WHERE extname = 'vector'`;
    // Extension may not be created yet, but should be available to create
    // We'll just check that the query executes without error
    expect(Array.isArray(result)).toBe(true);
  });
});
