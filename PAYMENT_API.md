# Paytm Payment Gateway API Documentation

This API provides integration with Paytm Payment Gateway for UPI and Rupay card transactions.

## Setup

### Environment Variables

Add the following environment variables to your `.env` file:

```env
# Paytm Payment Gateway Configuration
PAYTM_MERCHANT_ID=your-paytm-merchant-id
PAYTM_MERCHANT_KEY=your-paytm-merchant-key
PAYTM_WEBSITE=WEBSTAGING
PAYTM_INDUSTRY_TYPE=Retail
PAYTM_CHANNEL_ID=WEB
PAYTM_CALLBACK_URL=http://localhost:5001/api/v1/payment/callback
PAYTM_ENVIRONMENT=STAGING
```

**Note:** For production, use:
- `PAYTM_ENVIRONMENT=PRODUCTION`
- Update `PAYTM_WEBSITE` to your production website name
- Update `PAYTM_CALLBACK_URL` to your production callback URL

### Getting Paytm Credentials

1. Register as a merchant on [Paytm Business](https://business.paytm.com/)
2. Navigate to Developer Settings
3. Get your Merchant ID and Merchant Key
4. Configure your website and callback URL

## API Endpoints

### 1. Get Payment Configuration

**Endpoint:** `GET /api/v1/payment/config`

**Description:** Get payment gateway configuration (public information only).

**Response:**
```json
{
  "success": true,
  "data": {
    "supportedMethods": ["UPI", "CARD"],
    "environment": "STAGING",
    "merchantId": "***"
  }
}
```

### 2. Initiate UPI Payment

**Endpoint:** `POST /api/v1/payment/initiate/upi`

**Authentication:** Required (JWT Token)

**Request Body:**
```json
{
  "amount": "100.00",
  "customerEmail": "customer@example.com",
  "customerPhone": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "UPI payment initiated successfully",
  "data": {
    "orderId": "UPI_abc123_1234567890",
    "txnToken": "transaction_token_from_paytm",
    "amount": "100.00",
    "paytmUrl": "https://securegw-stage.paytm.in/theia/api/v1/showPaymentPage?...",
    "paymentMode": "UPI"
  }
}
```

### 3. Initiate Card Payment

**Endpoint:** `POST /api/v1/payment/initiate/card`

**Authentication:** Required (JWT Token)

**Request Body:**
```json
{
  "amount": "100.00",
  "customerEmail": "customer@example.com",
  "customerPhone": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Card payment initiated successfully",
  "data": {
    "orderId": "CARD_xyz789_1234567890",
    "txnToken": "transaction_token_from_paytm",
    "amount": "100.00",
    "paytmUrl": "https://securegw-stage.paytm.in/theia/api/v1/showPaymentPage?...",
    "paymentMode": "CARD"
  }
}
```

### 4. Check Payment Status

**Endpoint:** `GET /api/v1/payment/status/:orderId`

**Description:** Check the status of a payment transaction.

**Response:**
```json
{
  "success": true,
  "message": "Payment completed successfully",
  "data": {
    "orderId": "UPI_abc123_1234567890",
    "status": "TXN_SUCCESS",
    "txnId": "20231030111212345",
    "bankTxnId": "1234567890",
    "amount": "100.00",
    "paymentMode": "UPI",
    "gatewayName": "WALLET",
    "bankName": "PAYTM",
    "txnDate": "2023-10-30 11:12:13.0",
    "respCode": "01",
    "respMsg": "Txn Success"
  }
}
```

### 5. Payment Callback

**Endpoint:** `POST /api/v1/payment/callback`

**Description:** This endpoint is called by Paytm after payment completion. It should be configured in your Paytm merchant dashboard.

**Request Body:** Form data from Paytm with payment details.

**Response:**
```json
{
  "success": true,
  "message": "Payment callback processed",
  "data": {
    "orderId": "UPI_abc123_1234567890",
    "txnId": "20231030111212345",
    "bankTxnId": "1234567890",
    "amount": "100.00",
    "status": "TXN_SUCCESS",
    "respCode": "01",
    "txnDate": "2023-10-30 11:12:13.0",
    "gatewayName": "WALLET",
    "bankName": "PAYTM",
    "paymentMode": "UPI"
  }
}
```

### 6. Initiate Refund (Admin Only)

**Endpoint:** `POST /api/v1/payment/refund`

**Authentication:** Required (JWT Token with Admin role)

**Request Body:**
```json
{
  "orderId": "UPI_abc123_1234567890",
  "txnId": "20231030111212345",
  "refundAmount": "100.00"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Refund initiated successfully",
  "data": {
    "orderId": "UPI_abc123_1234567890",
    "txnId": "20231030111212345",
    "refundId": "REFUND12345",
    "refundAmount": "100.00",
    "status": "PENDING"
  }
}
```

## Payment Flow

### For Frontend Integration

1. **Initiate Payment:**
   - Call `/api/v1/payment/initiate/upi` or `/api/v1/payment/initiate/card`
   - Receive `txnToken` and `paytmUrl`

2. **Redirect to Paytm:**
   - Redirect user to the `paytmUrl` with the `txnToken`
   - User completes payment on Paytm's secure page

3. **Handle Callback:**
   - Paytm redirects back to your `callbackUrl`
   - Your backend receives payment status

4. **Verify Payment:**
   - Call `/api/v1/payment/status/:orderId` to verify final payment status
   - Update order status in your database

## Payment Status Codes

| Status | Description |
|--------|-------------|
| TXN_SUCCESS | Transaction successful |
| TXN_FAILURE | Transaction failed |
| PENDING | Transaction pending |

## Security Considerations

1. **Never expose Merchant Key:** Keep `PAYTM_MERCHANT_KEY` secure and never commit it to version control.

2. **Verify Checksums:** Always verify the checksum in payment callbacks to ensure authenticity.

3. **Use HTTPS:** Always use HTTPS in production for callback URLs.

4. **Validate on Server:** Always verify payment status on the server side before fulfilling orders.

5. **Admin-Only Operations:** Refund operations should only be accessible to admin users.

## Testing

### Testing with Paytm Staging

1. Use Paytm's staging environment: `PAYTM_ENVIRONMENT=STAGING`
2. Use test credentials provided by Paytm
3. Use test UPI IDs and card numbers provided by Paytm
4. Refer to [Paytm Testing Documentation](https://developer.paytm.com/docs/testing-integration/)

### Sample Test Flow

```bash
# 1. Initiate payment (requires authentication token)
curl -X POST http://localhost:5001/api/v1/payment/initiate/upi \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": "100.00",
    "customerEmail": "test@example.com",
    "customerPhone": "9876543210"
  }'

# 2. Check payment status
curl http://localhost:5001/api/v1/payment/status/UPI_abc123_1234567890

# 3. Get payment config
curl http://localhost:5001/api/v1/payment/config
```

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP status codes:
- `200 OK` - Successful operation
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Insufficient permissions
- `500 Internal Server Error` - Server-side error

## Support

For Paytm-specific issues:
- [Paytm Developer Documentation](https://developer.paytm.com/docs/)
- [Paytm Business Support](https://business.paytm.com/support)

For API issues:
- Check server logs for detailed error messages
- Ensure all environment variables are properly configured
- Verify network connectivity to Paytm servers
