import { db } from '../server/db';
import { storage } from '../server/storage';
import { exchanges, cryptocurrencies } from '../shared/schema';

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Initialize exchanges if they don't exist
    const initialExchanges = [
      { name: 'Binance', api_url: 'https://api.binance.com', is_active: true },
      { name: 'Gate', api_url: 'https://api.gateio.ws', is_active: true },
      { name: 'Kucoin', api_url: 'https://api.kucoin.com', is_active: true },
      { name: 'Bybit', api_url: 'https://api.bybit.com', is_active: true }
    ];

    console.log('Creating initial exchanges...');
    const existingExchanges = await storage.getAllExchanges();
    
    if (existingExchanges.length === 0) {
      for (const exchange of initialExchanges) {
        await storage.createExchange(exchange);
        console.log(`Created exchange: ${exchange.name}`);
      }
    } else {
      console.log('Exchanges already exist in the database.');
    }
    
    console.log('Database initialization completed successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    process.exit(0);
  }
}

// Run the initialization
initializeDatabase();