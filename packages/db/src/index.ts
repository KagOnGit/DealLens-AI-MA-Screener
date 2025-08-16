import { PrismaClient } from '@prisma/client';

declare global {
  var __db: PrismaClient | undefined;
}

export const db =
  globalThis.__db ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__db = db;
}

// Export types
export type {
  User,
  Company,
  FinancialMetric,
  MarketData,
  Deal,
  SavedScreen,
  Watchlist,
  WatchlistItem,
  Alert,
  UserRole,
  PeriodType,
  DealStatus,
  DealType,
  PaymentMethod,
  AlertType,
} from '@prisma/client';

// Utility functions
export async function connectDb() {
  try {
    await db.$connect();
    console.log('Connected to database');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
}

export async function disconnectDb() {
  try {
    await db.$disconnect();
    console.log('Disconnected from database');
  } catch (error) {
    console.error('Failed to disconnect from database:', error);
  }
}

// Health check
export async function checkDbHealth() {
  try {
    await db.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message, timestamp: new Date() };
  }
}
