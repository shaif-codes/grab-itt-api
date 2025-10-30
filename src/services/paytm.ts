import https from 'https';
import crypto from 'crypto';

// Paytm configuration interface
interface PaytmConfig {
  merchantId: string;
  merchantKey: string;
  website: string;
  industryType: string;
  channelId: string;
  callbackUrl: string;
  environment: 'STAGING' | 'PRODUCTION';
}

// Payment transaction request
interface PaymentTransactionRequest {
  orderId: string;
  amount: string;
  customerId: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentMode?: 'UPI' | 'CARD';
}

// Payment status response
interface PaymentStatusResponse {
  success: boolean;
  status: string;
  txnId?: string;
  bankTxnId?: string;
  orderId?: string;
  txnAmount?: string;
  gatewayName?: string;
  bankName?: string;
  paymentMode?: string;
  respCode?: string;
  respMsg?: string;
  txnDate?: string;
}

export class PaytmService {
  private static config: PaytmConfig;

  // Initialize Paytm configuration from environment variables
  static initialize() {
    this.config = {
      merchantId: process.env.PAYTM_MERCHANT_ID || '',
      merchantKey: process.env.PAYTM_MERCHANT_KEY || '',
      website: process.env.PAYTM_WEBSITE || 'WEBSTAGING',
      industryType: process.env.PAYTM_INDUSTRY_TYPE || 'Retail',
      channelId: process.env.PAYTM_CHANNEL_ID || 'WEB',
      callbackUrl: process.env.PAYTM_CALLBACK_URL || 'http://localhost:5000/api/v1/payment/callback',
      environment: (process.env.PAYTM_ENVIRONMENT as 'STAGING' | 'PRODUCTION') || 'STAGING'
    };

    // Validate configuration
    if (!this.config.merchantId || !this.config.merchantKey) {
      console.warn('⚠️  Paytm configuration is incomplete. Please set PAYTM_MERCHANT_ID and PAYTM_MERCHANT_KEY environment variables.');
    }
  }

  // Get Paytm host based on environment
  private static getPaytmHost(): string {
    return this.config.environment === 'PRODUCTION'
      ? 'securegw.paytm.in'
      : 'securegw-stage.paytm.in';
  }

  // Generate checksum for Paytm request
  private static async generateChecksum(params: Record<string, any>): Promise<string> {
    const paramsString = JSON.stringify(params);
    const salt = this.config.merchantKey;
    
    // Create HMAC-SHA256 checksum
    const checksum = crypto
      .createHmac('sha256', salt)
      .update(paramsString)
      .digest('hex');
    
    return checksum;
  }

  // Verify checksum for Paytm response
  private static async verifyChecksum(params: Record<string, any>, checksum: string): Promise<boolean> {
    const { CHECKSUMHASH, ...paramsWithoutChecksum } = params;
    const expectedChecksum = await this.generateChecksum(paramsWithoutChecksum);
    return checksum === expectedChecksum;
  }

  // Initiate payment transaction
  static async initiateTransaction(request: PaymentTransactionRequest): Promise<any> {
    if (!this.config.merchantId || !this.config.merchantKey) {
      throw new Error('Paytm configuration is not properly set');
    }

    const paytmParams: Record<string, any> = {
      body: {
        requestType: 'Payment',
        mid: this.config.merchantId,
        websiteName: this.config.website,
        orderId: request.orderId,
        txnAmount: {
          value: request.amount,
          currency: 'INR'
        },
        userInfo: {
          custId: request.customerId,
        },
        callbackUrl: this.config.callbackUrl,
      }
    };

    // Add optional fields
    if (request.customerEmail) {
      paytmParams.body.userInfo.email = request.customerEmail;
    }
    if (request.customerPhone) {
      paytmParams.body.userInfo.mobile = request.customerPhone;
    }

    // Generate checksum
    const checksum = await this.generateChecksum(paytmParams.body);
    
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        ...paytmParams,
        head: {
          signature: checksum
        }
      });

      const options = {
        hostname: this.getPaytmHost(),
        port: 443,
        path: `/theia/api/v1/initiateTransaction?mid=${this.config.merchantId}&orderId=${request.orderId}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve({
              success: response.body?.resultInfo?.resultStatus === 'S',
              txnToken: response.body?.txnToken,
              orderId: request.orderId,
              amount: request.amount,
              message: response.body?.resultInfo?.resultMsg,
              paytmUrl: `https://${this.getPaytmHost()}/theia/api/v1/showPaymentPage?mid=${this.config.merchantId}&orderId=${request.orderId}`,
            });
          } catch (error) {
            reject(new Error('Failed to parse Paytm response'));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  // Check transaction status
  static async checkTransactionStatus(orderId: string): Promise<PaymentStatusResponse> {
    if (!this.config.merchantId || !this.config.merchantKey) {
      throw new Error('Paytm configuration is not properly set');
    }

    const paytmParams: Record<string, any> = {
      body: {
        mid: this.config.merchantId,
        orderId: orderId,
      }
    };

    // Generate checksum
    const checksum = await this.generateChecksum(paytmParams.body);

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        ...paytmParams,
        head: {
          signature: checksum
        }
      });

      const options = {
        hostname: this.getPaytmHost(),
        port: 443,
        path: `/v3/order/status`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            const body = response.body;
            
            resolve({
              success: body?.resultInfo?.resultStatus === 'TXN_SUCCESS',
              status: body?.resultInfo?.resultStatus || 'UNKNOWN',
              txnId: body?.txnId,
              bankTxnId: body?.bankTxnId,
              orderId: body?.orderId,
              txnAmount: body?.txnAmount,
              gatewayName: body?.gatewayName,
              bankName: body?.bankName,
              paymentMode: body?.paymentMode,
              respCode: body?.resultInfo?.resultCode,
              respMsg: body?.resultInfo?.resultMsg,
              txnDate: body?.txnDate,
            });
          } catch (error) {
            reject(new Error('Failed to parse Paytm status response'));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  // Verify payment callback
  static async verifyCallback(params: Record<string, any>): Promise<boolean> {
    const checksum = params.CHECKSUMHASH;
    if (!checksum) {
      return false;
    }
    
    return this.verifyChecksum(params, checksum);
  }

  // Process refund
  static async initiateRefund(orderId: string, txnId: string, refundAmount: string, refId: string): Promise<any> {
    if (!this.config.merchantId || !this.config.merchantKey) {
      throw new Error('Paytm configuration is not properly set');
    }

    const paytmParams: Record<string, any> = {
      body: {
        mid: this.config.merchantId,
        orderId: orderId,
        txnId: txnId,
        txnType: 'REFUND',
        refundAmount: refundAmount,
        refId: refId,
      }
    };

    // Generate checksum
    const checksum = await this.generateChecksum(paytmParams.body);

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        ...paytmParams,
        head: {
          signature: checksum
        }
      });

      const options = {
        hostname: this.getPaytmHost(),
        port: 443,
        path: `/refund/apply`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve({
              success: response.body?.resultInfo?.resultStatus === 'TXN_SUCCESS' || response.body?.resultInfo?.resultStatus === 'PENDING',
              status: response.body?.resultInfo?.resultStatus,
              refundId: response.body?.refundId,
              message: response.body?.resultInfo?.resultMsg,
            });
          } catch (error) {
            reject(new Error('Failed to parse Paytm refund response'));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }
}

// Initialize Paytm service on module load
PaytmService.initialize();
