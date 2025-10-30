import { Request, Response } from 'express';
import { PaytmService } from '../../services/paytm.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { nanoid } from 'nanoid';

export class PaymentController {
  /**
   * Initiate UPI payment transaction
   * POST /api/v1/payment/initiate/upi
   */
  static async initiateUpiPayment(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not authenticated' 
        });
      }

      const { amount, customerEmail, customerPhone } = req.body;

      // Validate required fields
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Valid amount is required' 
        });
      }

      // Generate unique order ID
      const orderId = `UPI_${nanoid(12)}_${Date.now()}`;

      // Initiate payment transaction
      const paymentResponse = await PaytmService.initiateTransaction({
        orderId,
        amount: parseFloat(amount).toFixed(2),
        customerId: userId,
        customerEmail,
        customerPhone,
        paymentMode: 'UPI'
      });

      if (paymentResponse.success) {
        return res.status(200).json({
          success: true,
          message: 'UPI payment initiated successfully',
          data: {
            orderId: paymentResponse.orderId,
            txnToken: paymentResponse.txnToken,
            amount: paymentResponse.amount,
            paytmUrl: paymentResponse.paytmUrl,
            paymentMode: 'UPI'
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: paymentResponse.message || 'Failed to initiate UPI payment'
        });
      }
    } catch (error: any) {
      console.error('Error initiating UPI payment:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error while initiating UPI payment',
        error: error.message 
      });
    }
  }

  /**
   * Initiate Rupay card payment transaction
   * POST /api/v1/payment/initiate/card
   */
  static async initiateCardPayment(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not authenticated' 
        });
      }

      const { amount, customerEmail, customerPhone } = req.body;

      // Validate required fields
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Valid amount is required' 
        });
      }

      // Generate unique order ID
      const orderId = `CARD_${nanoid(12)}_${Date.now()}`;

      // Initiate payment transaction
      const paymentResponse = await PaytmService.initiateTransaction({
        orderId,
        amount: parseFloat(amount).toFixed(2),
        customerId: userId,
        customerEmail,
        customerPhone,
        paymentMode: 'CARD'
      });

      if (paymentResponse.success) {
        return res.status(200).json({
          success: true,
          message: 'Card payment initiated successfully',
          data: {
            orderId: paymentResponse.orderId,
            txnToken: paymentResponse.txnToken,
            amount: paymentResponse.amount,
            paytmUrl: paymentResponse.paytmUrl,
            paymentMode: 'CARD'
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: paymentResponse.message || 'Failed to initiate card payment'
        });
      }
    } catch (error: any) {
      console.error('Error initiating card payment:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error while initiating card payment',
        error: error.message 
      });
    }
  }

  /**
   * Check payment status
   * GET /api/v1/payment/status/:orderId
   */
  static async checkPaymentStatus(req: Request, res: Response) {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Order ID is required' 
        });
      }

      // Check transaction status
      const statusResponse = await PaytmService.checkTransactionStatus(orderId);

      return res.status(200).json({
        success: statusResponse.success,
        message: statusResponse.success ? 'Payment completed successfully' : 'Payment not completed',
        data: {
          orderId: statusResponse.orderId,
          status: statusResponse.status,
          txnId: statusResponse.txnId,
          bankTxnId: statusResponse.bankTxnId,
          amount: statusResponse.txnAmount,
          paymentMode: statusResponse.paymentMode,
          gatewayName: statusResponse.gatewayName,
          bankName: statusResponse.bankName,
          txnDate: statusResponse.txnDate,
          respCode: statusResponse.respCode,
          respMsg: statusResponse.respMsg,
        }
      });
    } catch (error: any) {
      console.error('Error checking payment status:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error while checking payment status',
        error: error.message 
      });
    }
  }

  /**
   * Handle payment callback from Paytm
   * POST /api/v1/payment/callback
   */
  static async handlePaymentCallback(req: Request, res: Response) {
    try {
      const callbackData = req.body;

      // Verify callback authenticity
      const isValid = await PaytmService.verifyCallback(callbackData);

      if (!isValid) {
        console.error('Invalid callback checksum');
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid callback data' 
        });
      }

      // Extract payment details
      const {
        ORDERID,
        TXNID,
        BANKTXNID,
        TXNAMOUNT,
        STATUS,
        RESPCODE,
        RESPMSG,
        TXNDATE,
        GATEWAYNAME,
        BANKNAME,
        PAYMENTMODE
      } = callbackData;

      // Log the callback for debugging
      console.log('Payment callback received:', {
        orderId: ORDERID,
        txnId: TXNID,
        status: STATUS,
        amount: TXNAMOUNT
      });

      // Here you would typically:
      // 1. Update order status in database
      // 2. Send notification to user
      // 3. Trigger any post-payment actions

      // Return success response
      return res.status(200).json({
        success: STATUS === 'TXN_SUCCESS',
        message: RESPMSG || 'Payment callback processed',
        data: {
          orderId: ORDERID,
          txnId: TXNID,
          bankTxnId: BANKTXNID,
          amount: TXNAMOUNT,
          status: STATUS,
          respCode: RESPCODE,
          txnDate: TXNDATE,
          gatewayName: GATEWAYNAME,
          bankName: BANKNAME,
          paymentMode: PAYMENTMODE
        }
      });
    } catch (error: any) {
      console.error('Error handling payment callback:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error while processing payment callback',
        error: error.message 
      });
    }
  }

  /**
   * Initiate refund
   * POST /api/v1/payment/refund
   */
  static async initiateRefund(req: AuthenticatedRequest, res: Response) {
    try {
      // Only admins should be able to initiate refunds
      // This check should be done via middleware in routes
      
      const { orderId, txnId, refundAmount } = req.body;

      // Validate required fields
      if (!orderId || !txnId || !refundAmount) {
        return res.status(400).json({ 
          success: false, 
          message: 'Order ID, transaction ID, and refund amount are required' 
        });
      }

      if (parseFloat(refundAmount) <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Valid refund amount is required' 
        });
      }

      // Generate unique refund ID
      const refId = `REF_${nanoid(12)}_${Date.now()}`;

      // Initiate refund
      const refundResponse = await PaytmService.initiateRefund(
        orderId,
        txnId,
        parseFloat(refundAmount).toFixed(2),
        refId
      );

      if (refundResponse.success) {
        return res.status(200).json({
          success: true,
          message: 'Refund initiated successfully',
          data: {
            orderId,
            txnId,
            refundId: refundResponse.refundId,
            refundAmount,
            status: refundResponse.status
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: refundResponse.message || 'Failed to initiate refund'
        });
      }
    } catch (error: any) {
      console.error('Error initiating refund:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error while initiating refund',
        error: error.message 
      });
    }
  }

  /**
   * Get payment configuration
   * GET /api/v1/payment/config
   */
  static async getPaymentConfig(req: Request, res: Response) {
    try {
      // Return public configuration (don't expose secrets)
      return res.status(200).json({
        success: true,
        data: {
          supportedMethods: ['UPI', 'CARD'],
          environment: process.env.PAYTM_ENVIRONMENT || 'STAGING',
          merchantId: process.env.PAYTM_MERCHANT_ID ? '***' : 'NOT_CONFIGURED'
        }
      });
    } catch (error: any) {
      console.error('Error getting payment config:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error while getting payment configuration',
        error: error.message 
      });
    }
  }
}
