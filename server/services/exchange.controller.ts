import { Request, Response } from 'express';
import { storage } from '../storage';
import { ExchangeFactory } from './exchange.service';
import { z } from 'zod';

export class ExchangeController {
  // Sync data from a specific exchange
  static async syncExchangeData(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const schema = z.object({
        exchange: z.string(),
        basePair: z.string()
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid request data', 
          errors: result.error.errors 
        });
        return;
      }
      
      const { exchange, basePair } = result.data;
      
      // Get exchange integration
      const exchangeService = ExchangeFactory.getExchange(exchange);
      
      // Sync data
      await exchangeService.syncExchangeData(basePair);
      
      res.status(200).json({
        success: true,
        message: `Successfully synchronized data from ${exchange}`
      });
    } catch (error: any) {
      console.error('Error syncing exchange data:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error syncing exchange data'
      });
    }
  }
  
  // Get crypto data with optional exchange filter
  static async getCryptoData(req: Request, res: Response): Promise<void> {
    try {
      // Get exchange filter if provided
      const exchangeName = req.query.exchange as string | undefined;
      
      // Get latest prices
      const cryptoPrices = await storage.getLatestCryptoPrices();
      
      // Filter by exchange if provided
      let filteredPrices = cryptoPrices;
      if (exchangeName) {
        const exchange = await storage.getExchangeByName(exchangeName);
        if (exchange) {
          filteredPrices = cryptoPrices.filter(price => price.exchange_id === exchange.id);
        }
      }
      
      res.status(200).json({
        success: true,
        data: filteredPrices
      });
    } catch (error: any) {
      console.error('Error fetching crypto data:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching crypto data'
      });
    }
  }
  
  // Get list of all exchanges
  static async getExchanges(req: Request, res: Response): Promise<void> {
    try {
      const exchanges = await storage.getAllExchanges();
      
      res.status(200).json({
        success: true,
        data: exchanges
      });
    } catch (error: any) {
      console.error('Error fetching exchanges:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching exchanges'
      });
    }
  }
  
  // Get list of all cryptocurrencies
  static async getCryptocurrencies(req: Request, res: Response): Promise<void> {
    try {
      const cryptocurrencies = await storage.getAllCryptocurrencies();
      
      res.status(200).json({
        success: true,
        data: cryptocurrencies
      });
    } catch (error: any) {
      console.error('Error fetching cryptocurrencies:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching cryptocurrencies'
      });
    }
  }
  
  // Update exchange status (enable/disable)
  static async updateExchangeStatus(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const schema = z.object({
        is_active: z.boolean(),
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid request data', 
          errors: result.error.errors 
        });
        return;
      }
      
      // Get exchange ID from params
      const exchangeId = parseInt(req.params.id);
      if (isNaN(exchangeId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid exchange ID'
        });
        return;
      }
      
      // Check if exchange exists
      const exchange = await storage.getExchange(exchangeId);
      if (!exchange) {
        res.status(404).json({
          success: false,
          message: 'Exchange not found'
        });
        return;
      }
      
      // Update exchange status
      await storage.updateExchangeStatus(exchangeId, result.data.is_active);
      
      res.status(200).json({
        success: true,
        message: `Exchange status updated successfully`
      });
    } catch (error: any) {
      console.error('Error updating exchange status:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error updating exchange status'
      });
    }
  }
}