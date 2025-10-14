import { Request, Response } from 'express';

export class AuthController {
  // Logout user
  static async logout(req: Request, res: Response) {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
  }
}
