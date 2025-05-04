import { 
  users, type User, type InsertUser, 
  cryptocurrencies, type Cryptocurrency, type InsertCryptocurrency,
  exchanges, type Exchange, type InsertExchange,
  cryptoPrices, type CryptoPrice, type InsertCryptoPrice,
  userFavorites, type UserFavorite, type InsertUserFavorite
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Cryptocurrency operations
  getCryptocurrency(id: number): Promise<Cryptocurrency | undefined>;
  getCryptocurrencyBySymbol(symbol: string): Promise<Cryptocurrency | undefined>;
  createCryptocurrency(crypto: InsertCryptocurrency): Promise<Cryptocurrency>;
  getAllCryptocurrencies(): Promise<Cryptocurrency[]>;
  
  // Exchange operations
  getExchange(id: number): Promise<Exchange | undefined>;
  getExchangeByName(name: string): Promise<Exchange | undefined>;
  createExchange(exchange: InsertExchange): Promise<Exchange>;
  getAllExchanges(): Promise<Exchange[]>;
  updateExchangeStatus(id: number, isActive: boolean): Promise<void>;
  
  // Crypto price operations
  getCryptoPrice(id: number): Promise<CryptoPrice | undefined>;
  getCryptoPricesByExchange(exchangeId: number): Promise<CryptoPrice[]>;
  createCryptoPrice(price: InsertCryptoPrice): Promise<CryptoPrice>;
  updateCryptoPrice(id: number, price: Partial<InsertCryptoPrice>): Promise<void>;
  getLatestCryptoPrices(): Promise<CryptoPrice[]>;
  
  // User favorite operations
  getUserFavorites(userId: number): Promise<UserFavorite[]>;
  addUserFavorite(favorite: InsertUserFavorite): Promise<UserFavorite>;
  removeUserFavorite(userId: number, cryptoId: number, exchangeId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Cryptocurrency operations
  async getCryptocurrency(id: number): Promise<Cryptocurrency | undefined> {
    const [crypto] = await db.select().from(cryptocurrencies).where(eq(cryptocurrencies.id, id));
    return crypto;
  }

  async getCryptocurrencyBySymbol(symbol: string): Promise<Cryptocurrency | undefined> {
    const [crypto] = await db.select().from(cryptocurrencies).where(eq(cryptocurrencies.symbol, symbol));
    return crypto;
  }

  async createCryptocurrency(crypto: InsertCryptocurrency): Promise<Cryptocurrency> {
    const [newCrypto] = await db.insert(cryptocurrencies).values(crypto).returning();
    return newCrypto;
  }

  async getAllCryptocurrencies(): Promise<Cryptocurrency[]> {
    return await db.select().from(cryptocurrencies);
  }

  // Exchange operations
  async getExchange(id: number): Promise<Exchange | undefined> {
    const [exchange] = await db.select().from(exchanges).where(eq(exchanges.id, id));
    return exchange;
  }

  async getExchangeByName(name: string): Promise<Exchange | undefined> {
    const [exchange] = await db.select().from(exchanges).where(eq(exchanges.name, name));
    return exchange;
  }

  async createExchange(exchange: InsertExchange): Promise<Exchange> {
    const [newExchange] = await db.insert(exchanges).values(exchange).returning();
    return newExchange;
  }

  async getAllExchanges(): Promise<Exchange[]> {
    return await db.select().from(exchanges);
  }

  async updateExchangeStatus(id: number, isActive: boolean): Promise<void> {
    await db.update(exchanges).set({ is_active: isActive }).where(eq(exchanges.id, id));
  }

  // Crypto price operations
  async getCryptoPrice(id: number): Promise<CryptoPrice | undefined> {
    const [price] = await db.select().from(cryptoPrices).where(eq(cryptoPrices.id, id));
    return price;
  }

  async getCryptoPricesByExchange(exchangeId: number): Promise<CryptoPrice[]> {
    return await db.select().from(cryptoPrices).where(eq(cryptoPrices.exchange_id, exchangeId));
  }

  async createCryptoPrice(price: InsertCryptoPrice): Promise<CryptoPrice> {
    const [newPrice] = await db.insert(cryptoPrices).values(price).returning();
    return newPrice;
  }

  async updateCryptoPrice(id: number, price: Partial<InsertCryptoPrice>): Promise<void> {
    await db.update(cryptoPrices).set(price).where(eq(cryptoPrices.id, id));
  }

  async getLatestCryptoPrices(): Promise<CryptoPrice[]> {
    return await db.select().from(cryptoPrices).orderBy(desc(cryptoPrices.last_updated));
  }

  // User favorite operations
  async getUserFavorites(userId: number): Promise<UserFavorite[]> {
    return await db.select().from(userFavorites).where(eq(userFavorites.user_id, userId));
  }

  async addUserFavorite(favorite: InsertUserFavorite): Promise<UserFavorite> {
    const [newFavorite] = await db.insert(userFavorites).values(favorite).returning();
    return newFavorite;
  }

  async removeUserFavorite(userId: number, cryptoId: number, exchangeId: number): Promise<void> {
    await db.delete(userFavorites).where(
      and(
        eq(userFavorites.user_id, userId),
        eq(userFavorites.crypto_id, cryptoId),
        eq(userFavorites.exchange_id, exchangeId)
      )
    );
  }
}

export const storage = new DatabaseStorage();
