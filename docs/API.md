# 📡 API Documentation

## Overview

The Order Matching System API provides a RESTful interface for order management, trading operations, and system monitoring. All sensitive data is encrypted using RSA encryption for security.

## Base URL

```
http://localhost:5000/api
```

## Authentication

Currently, the API uses encryption-based security rather than traditional authentication. All order data must be encrypted using the server's public key before transmission.

## Endpoints

### Health Check

#### GET /health
Returns system status and version information.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

**Status Codes:**
- `200` - System is healthy

---

### Orders

#### GET /api/orders/public-key
Returns the RSA public key for client-side encryption.

**Response:**
```json
{
  "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----"
}
```

**Status Codes:**
- `200` - Public key retrieved successfully

---

#### POST /api/orders/place
Places a new buy or sell order. The order data must be encrypted using the server's public key.

**Request Body:**
```json
{
  "encryptedData": "encrypted_order_data_string"
}
```

**Order Data Structure (before encryption):**
```json
{
  "orderType": "buyer" | "seller",
  "quantity": number,
  "price": number
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order placed successfully",
  "orderId": 123
}
```

**Status Codes:**
- `200` - Order placed successfully
- `400` - Invalid order data or encryption
- `500` - Server error

**Validation Rules:**
- `orderType` must be either "buyer" or "seller"
- `quantity` must be a positive number
- `price` must be a positive number
- `encryptedData` must be a valid RSA encrypted string

---

#### GET /api/orders/pending
Returns all active buy and sell orders in the order book.

**Response:**
```json
{
  "orders": [
    {
      "id": 1,
      "orderType": "buyer",
      "quantity": 100,
      "price": 50.00,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Orders retrieved successfully

---

#### GET /api/orders/completed
Returns all executed trades.

**Response:**
```json
{
  "orders": [
    {
      "id": 1,
      "price": 50.00,
      "quantity": 100,
      "buyer_order_id": 1,
      "seller_order_id": 2,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Completed orders retrieved successfully

---

## Error Responses

### Standard Error Format
```json
{
  "error": "Error message",
  "status": 400,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Common Error Codes

- `400` - Bad Request (invalid input)
- `404` - Not Found (endpoint doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **Limit**: 100 requests per 15 minutes per IP address
- **Headers**: Rate limit information is included in response headers
- **Exceeded**: Returns 429 status code with error message

---

## Encryption Process

### Client-Side Encryption
1. Retrieve public key from `/api/orders/public-key`
2. Create order data object
3. Encrypt using RSA public key
4. Send encrypted data to `/api/orders/place`

### Example JavaScript Implementation
```javascript
import JSEncrypt from 'jsencrypt';

// Get public key
const keyResponse = await axios.get('/api/orders/public-key');
const publicKey = keyResponse.data.publicKey;

// Create order data
const orderData = {
  orderType: 'buyer',
  quantity: 100,
  price: 50.00
};

// Encrypt data
const encrypt = new JSEncrypt();
encrypt.setPublicKey(publicKey);
const encryptedData = encrypt.encrypt(JSON.stringify(orderData));

// Send order
const response = await axios.post('/api/orders/place', {
  encryptedData
});
```

---

## WebSocket Support (Future)

Planned WebSocket endpoints for real-time updates:
- `/ws/orders` - Real-time order book updates
- `/ws/trades` - Real-time trade notifications
- `/ws/price` - Real-time price updates

---

## Testing

### Using curl

**Get Public Key:**
```bash
curl -X GET http://localhost:5000/api/orders/public-key
```

**Get Pending Orders:**
```bash
curl -X GET http://localhost:5000/api/orders/pending
```

**Get Completed Orders:**
```bash
curl -X GET http://localhost:5000/api/orders/completed
```

**Health Check:**
```bash
curl -X GET http://localhost:5000/health
```

### Using Postman

1. Import the API collection
2. Set base URL to `http://localhost:5000`
3. Use the provided examples for testing

---

## SDK Libraries

### JavaScript/TypeScript
```bash
npm install order-matching-sdk
```

```javascript
import { OrderMatchingClient } from 'order-matching-sdk';

const client = new OrderMatchingClient('http://localhost:5000');

// Place order
const order = await client.placeOrder({
  orderType: 'buyer',
  quantity: 100,
  price: 50.00
});

// Get orders
const pendingOrders = await client.getPendingOrders();
const completedOrders = await client.getCompletedOrders();
```

---

## Versioning

API versioning is handled through URL paths:
- Current version: `/api/v1/`
- Future versions: `/api/v2/`, `/api/v3/`, etc.

---

## Changelog

### v1.0.0 (Current)
- Initial API release
- Basic order management
- RSA encryption
- Rate limiting
- Health monitoring

### Planned Features
- WebSocket support
- User authentication
- Advanced order types
- Market data endpoints 