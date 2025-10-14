import { Request, Response } from 'express';
import { syncDatabase } from '../../models/index.js';

export class AdminController {
  // Sync database schema
  static async syncDatabase(req: Request, res: Response) {
    try {
      const force = req.query.force === 'true';
      const result = await syncDatabase(force);
      
      if (result.success) {
        res.json({ success: true, message: result.message });
      } else {
        res.status(500).json({ success: false, message: result.message, error: result.error });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Database sync failed', error: error.message });
    }
  }
}
