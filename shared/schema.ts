import { pgTable, text, serial, integer, boolean, doublePrecision, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Cryptocurrencies table to store information about different cryptocurrencies
export const cryptocurrencies = pgTable("cryptocurrencies", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  name: text("name"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Exchanges table to store information about different exchanges
export const exchanges = pgTable("exchanges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  api_url: text("api_url"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// CryptoPrices table to store price data from different exchanges
export const cryptoPrices = pgTable("crypto_prices", {
  id: serial("id").primaryKey(),
  exchange_id: integer("exchange_id").notNull().references(() => exchanges.id),
  crypto_id: integer("crypto_id").notNull().references(() => cryptocurrencies.id),
  pair: text("pair").notNull(),
  price: doublePrecision("price").notNull(),
  volume_24h: doublePrecision("volume_24h"),
  rsi: doublePrecision("rsi"),
  change_24h: doublePrecision("change_24h"),
  last_updated: timestamp("last_updated").defaultNow().notNull(),
});

// UserFavorites table to store user's favorite cryptocurrencies
export const userFavorites = pgTable("user_favorites", {
  id: serial("id").primaryKey(), // Add a primary key id instead of composite key
  user_id: integer("user_id").notNull().references(() => users.id),
  crypto_id: integer("crypto_id").notNull().references(() => cryptocurrencies.id),
  exchange_id: integer("exchange_id").notNull().references(() => exchanges.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});

export const insertCryptocurrencySchema = createInsertSchema(cryptocurrencies).pick({
  symbol: true,
  name: true
});

export const insertExchangeSchema = createInsertSchema(exchanges).pick({
  name: true,
  api_url: true,
  is_active: true
});

export const insertCryptoPriceSchema = createInsertSchema(cryptoPrices).pick({
  exchange_id: true,
  crypto_id: true,
  pair: true,
  price: true,
  volume_24h: true,
  rsi: true,
  change_24h: true
});

export const insertUserFavoriteSchema = createInsertSchema(userFavorites).pick({
  user_id: true,
  crypto_id: true,
  exchange_id: true
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCryptocurrency = z.infer<typeof insertCryptocurrencySchema>;
export type Cryptocurrency = typeof cryptocurrencies.$inferSelect;

export type InsertExchange = z.infer<typeof insertExchangeSchema>;
export type Exchange = typeof exchanges.$inferSelect;

export type InsertCryptoPrice = z.infer<typeof insertCryptoPriceSchema>;
export type CryptoPrice = typeof cryptoPrices.$inferSelect;

export type InsertUserFavorite = z.infer<typeof insertUserFavoriteSchema>;
export type UserFavorite = typeof userFavorites.$inferSelect;
