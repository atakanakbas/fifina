import axios from 'axios';
import { InsertCryptocurrency, InsertCryptoPrice, InsertExchange } from '@shared/schema';
import { storage } from '../storage';

// Interface for common exchange data structure
export interface ExchangeData {
  symbol: string;
  name?: string;
  price: number;
  volume24h: number;
  change24h: number;
  rsi?: number;
}

// Base class for all exchange integrations
export abstract class ExchangeIntegration {
  constructor(
    protected name: string,
    protected baseUrl: string,
  ) {}

  // Each exchange must implement the fetchData method
  abstract fetchData(basePair: string): Promise<ExchangeData[]>;

  // Common method to calculate RSI (can be overridden by specific exchanges)
  async calculateRSI(symbol: string, basePair: string): Promise<number> {
    // RSI calculation logic - can be implemented for each exchange
    return 50; // Default placeholder
  }

  // Helper to handle errors consistently
  protected handleError(error: any): never {
    console.error(`Error fetching data from ${this.name}:`, error);
    if (axios.isAxiosError(error)) {
      throw new Error(`${this.name} API error: ${error.message}`);
    }
    throw new Error(`${this.name} API error: ${error.message || 'Unknown error'}`);
  }

  // Synchronize exchange data with database
  async syncExchangeData(basePair: string): Promise<void> {
    try {
      // Get or create exchange record
      let exchange = await storage.getExchangeByName(this.name);
      if (!exchange) {
        const exchangeData: InsertExchange = {
          name: this.name,
          api_url: this.baseUrl,
          is_active: true
        };
        exchange = await storage.createExchange(exchangeData);
      }

      // Fetch data from exchange API
      const cryptoData = await this.fetchData(basePair);

      // Process each cryptocurrency
      for (const data of cryptoData) {
        // Get or create cryptocurrency record
        let crypto = await storage.getCryptocurrencyBySymbol(data.symbol);
        if (!crypto) {
          const cryptoData: InsertCryptocurrency = {
            symbol: data.symbol,
            name: data.name
          };
          crypto = await storage.createCryptocurrency(cryptoData);
        }

        // Save price information
        const priceData: InsertCryptoPrice = {
          exchange_id: exchange.id,
          crypto_id: crypto.id,
          pair: `${data.symbol}/${basePair}`,
          price: data.price,
          volume_24h: data.volume24h,
          change_24h: data.change24h,
          rsi: data.rsi
        };

        await storage.createCryptoPrice(priceData);
      }

      console.log(`Successfully synchronized data from ${this.name}`);
    } catch (error) {
      console.error(`Error synchronizing data from ${this.name}:`, error);
      throw error;
    }
  }
}

// Binance Exchange Integration
export class BinanceExchange extends ExchangeIntegration {
  constructor() {
    super('Binance', 'https://api.binance.com');
  }

  async fetchData(basePair: string): Promise<ExchangeData[]> {
    try {
      const response = await axios.get(`/api/proxy/binance/api/v3/ticker/24hr`);
      
      // Process Binance response
      return response.data
        .filter((item: any) => item.symbol.endsWith(basePair))
        .map((item: any) => {
          const symbol = item.symbol.replace(basePair, '');
          return {
            symbol,
            price: parseFloat(item.lastPrice),
            volume24h: parseFloat(item.volume),
            change24h: parseFloat(item.priceChangePercent),
            // RSI will be calculated separately if needed
          };
        });
    } catch (error) {
      this.handleError(error);
    }
  }
}

// Gate.io Exchange Integration
export class GateExchange extends ExchangeIntegration {
  constructor() {
    super('Gate', 'https://api.gateio.ws');
  }

  async fetchData(basePair: string): Promise<ExchangeData[]> {
    try {
      const response = await axios.get(`/api/proxy/gate/spot/tickers`);
      
      // Process Gate.io response
      return response.data
        .filter((item: any) => item.currency_pair.endsWith(`_${basePair}`))
        .map((item: any) => {
          const symbol = item.currency_pair.split('_')[0];
          return {
            symbol,
            price: parseFloat(item.last),
            volume24h: parseFloat(item.base_volume),
            change24h: parseFloat(item.change_percentage) * 100,
            // RSI will be calculated separately if needed
          };
        });
    } catch (error) {
      this.handleError(error);
    }
  }
}

// KuCoin Exchange Integration
export class KucoinExchange extends ExchangeIntegration {
  constructor() {
    super('Kucoin', 'https://api.kucoin.com');
  }

  async fetchData(basePair: string): Promise<ExchangeData[]> {
    try {
      const response = await axios.get(`/api/proxy/kucoin/api/v1/market/allTickers`);
      
      // Process KuCoin response
      return response.data.data.ticker
        .filter((item: any) => item.symbol.endsWith(`-${basePair}`))
        .map((item: any) => {
          const symbol = item.symbol.split('-')[0];
          return {
            symbol,
            price: parseFloat(item.last),
            volume24h: parseFloat(item.vol),
            change24h: parseFloat(item.changeRate) * 100,
            // RSI will be calculated separately if needed
          };
        });
    } catch (error) {
      this.handleError(error);
    }
  }
}

// Bybit Exchange Integration
export class BybitExchange extends ExchangeIntegration {
  constructor() {
    super('Bybit', 'https://api.bybit.com');
  }

  async fetchData(basePair: string): Promise<ExchangeData[]> {
    try {
      const response = await axios.get(`/api/proxy/bybit/v5/market/tickers`);
      
      // Process Bybit response
      return response.data.result.list
        .filter((item: any) => item.symbol.endsWith(basePair))
        .map((item: any) => {
          const symbol = item.symbol.replace(basePair, '');
          return {
            symbol,
            price: parseFloat(item.lastPrice),
            volume24h: parseFloat(item.volume24h),
            change24h: parseFloat(item.price24hPcnt) * 100,
            // RSI will be calculated separately if needed
          };
        });
    } catch (error) {
      this.handleError(error);
    }
  }
}

// Factory to get the right exchange integration
export class ExchangeFactory {
  static getExchange(exchangeName: string): ExchangeIntegration {
    switch (exchangeName.toLowerCase()) {
      case 'binance':
        return new BinanceExchange();
      case 'gate':
        return new GateExchange();
      case 'kucoin':
        return new KucoinExchange();
      case 'bybit':
        return new BybitExchange();
      default:
        throw new Error(`Unsupported exchange: ${exchangeName}`);
    }
  }
}