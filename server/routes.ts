import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { ExchangeController } from "./services/exchange.controller";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check route
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });
  
  // Proxy routes for crypto exchanges to avoid CORS issues
  
  // Binance proxy using Python service to bypass regional restrictions
  app.get("/api/proxy/binance/*", async (req: Request, res: Response) => {
    try {
      const path = req.path.replace("/api/proxy/binance/", "");
      // Use our Python proxy service running on port 8000
      const url = `http://localhost:8000/binance/${path}`;
      
      console.log(`Using Python proxy for Binance: ${url}`);
      
      // Send request to our proxy service
      const response = await axios.get(url, { 
        params: req.query,
        timeout: 15000 // Longer timeout for proxy requests
      });
      
      res.json(response.data);
    } catch (error: any) {
      console.error("Error proxying Binance request:", error.message);
      
      // Fall back to direct request if proxy fails
      try {
        console.log("Proxy failed, trying direct request to Binance");
        const path = req.path.replace("/api/proxy/binance/", "");
        const url = `https://api.binance.com/${path}`;
        
        const response = await axios.get(url, { 
          params: req.query,
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json'
          }
        });
        
        res.json(response.data);
      } catch (directError: any) {
        // Return a more graceful error with specific error details
        const errorMsg = error.response ? 
          `Error (${error.response.status}): ${error.response.statusText}` : 
          error.message;
        
        res.status(500).json({ 
          error: "Error fetching data from Binance",
          details: errorMsg 
        });
      }
    }
  });
  
  // Gate.io proxy
  app.get("/api/proxy/gate/*", async (req: Request, res: Response) => {
    try {
      const path = req.path.replace("/api/proxy/gate/", "");
      const url = `https://api.gateio.ws/api/v4/${path}`;
      
      // Include timeout and proper headers
      const response = await axios.get(url, { 
        params: req.query,
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json'
        }
      });
      
      res.json(response.data);
    } catch (error: any) {
      console.error("Error proxying Gate.io request:", error.message);
      // Return a more graceful error with specific error details
      const errorMsg = error.response ? 
        `Error (${error.response.status}): ${error.response.statusText}` : 
        error.message;
      
      res.status(500).json({ 
        error: "Error fetching data from Gate.io",
        details: errorMsg 
      });
    }
  });
  
  // KuCoin proxy
  app.get("/api/proxy/kucoin/*", async (req: Request, res: Response) => {
    try {
      const path = req.path.replace("/api/proxy/kucoin/", "");
      const url = `https://api.kucoin.com/${path}`;
      
      // Include timeout and proper headers
      const response = await axios.get(url, { 
        params: req.query,
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json'
        }
      });
      
      res.json(response.data);
    } catch (error: any) {
      console.error("Error proxying KuCoin request:", error.message);
      // Return a more graceful error with specific error details
      const errorMsg = error.response ? 
        `Error (${error.response.status}): ${error.response.statusText}` : 
        error.message;
      
      res.status(500).json({ 
        error: "Error fetching data from KuCoin",
        details: errorMsg 
      });
    }
  });
  
  // Bybit proxy using Python service to bypass regional restrictions
  app.get("/api/proxy/bybit/*", async (req: Request, res: Response) => {
    try {
      const path = req.path.replace("/api/proxy/bybit/", "");
      // Use our Python proxy service running on port 8000
      const url = `http://localhost:8000/bybit/${path}`;
      
      console.log(`Using Python proxy for Bybit: ${url}`);
      
      // Send request to our proxy service
      const response = await axios.get(url, { 
        params: req.query,
        timeout: 15000 // Longer timeout for proxy requests
      });
      
      res.json(response.data);
    } catch (error: any) {
      console.error("Error proxying Bybit request:", error.message);
      
      // Fall back to direct request if proxy fails
      try {
        console.log("Proxy failed, trying direct request to Bybit");
        const path = req.path.replace("/api/proxy/bybit/", "");
        const url = `https://api.bybit.com/${path}`;
        
        const response = await axios.get(url, { 
          params: req.query,
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json'
          }
        });
        
        res.json(response.data);
      } catch (directError: any) {
        // Return a more graceful error with specific error details
        const errorMsg = error.response ? 
          `Error (${error.response.status}): ${error.response.statusText}` : 
          error.message;
        
        res.status(500).json({ 
          error: "Error fetching data from Bybit",
          details: errorMsg 
        });
      }
    }
  });

  // Exchange API routes
  
  // Get list of all exchanges
  app.get("/api/exchanges", ExchangeController.getExchanges);
  
  // Get list of all cryptocurrencies
  app.get("/api/cryptocurrencies", ExchangeController.getCryptocurrencies);
  
  // Get crypto data with optional exchange filter
  app.get("/api/crypto-data", ExchangeController.getCryptoData);
  
  // Sync data from a specific exchange
  app.post("/api/exchanges/sync", ExchangeController.syncExchangeData);
  
  // Update exchange status (enable/disable)
  app.patch("/api/exchanges/:id/status", ExchangeController.updateExchangeStatus);

  const httpServer = createServer(app);

  return httpServer;
}
