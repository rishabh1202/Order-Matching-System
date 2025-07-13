# 🏗️ System Architecture

## Overview

The Order Matching System is designed as a microservices-ready architecture with clear separation of concerns, security-first approach, and scalability in mind.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Mobile App    │    │   External      │
│   (React)       │    │   (React Native)│    │   Clients       │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      Load Balancer        │
                    │      (Future)             │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      API Gateway          │
                    │      (Express.js)         │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │    Order Matching         │
                    │    Engine                 │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      Database             │
                    │      (SQLite)             │
                    └───────────────────────────┘
```

## Component Architecture

### 1. Backend Layer

#### Server (`server.js`)
- **Purpose**: Main application entry point
- **Responsibilities**:
  - Express.js server setup
  - Middleware configuration
  - Route registration
  - Error handling
  - Graceful shutdown

#### Routes (`routes/orders.js`)
- **Purpose**: API endpoint handlers
- **Responsibilities**:
  - HTTP request/response handling
  - Input validation
  - Response formatting
  - Error handling

#### Services (`services/orderMatchingEngine.js`)
- **Purpose**: Business logic implementation
- **Responsibilities**:
  - Order matching algorithm
  - Trade execution
  - Order book management
  - Market data processing

#### Middleware (`middleware/`)
- **Encryption (`encryption.js`)**:
  - RSA key management
  - Data encryption/decryption
  - Security validation
- **Error Handler (`errorHandler.js`)**:
  - Global error catching
  - Error logging
  - Client-friendly error responses

#### Database (`database/connection.js`)
- **Purpose**: Data persistence layer
- **Responsibilities**:
  - SQLite connection management
  - Transaction handling
  - Query execution
  - Database initialization

### 2. Frontend Layer

#### App Component (`App.js`)
- **Purpose**: Main application component
- **Responsibilities**:
  - Application state management
  - API communication
  - Component orchestration
  - Real-time updates

#### Components (`components/`)
- **OrderForm (`OrderForm.js`)**:
  - Order input interface
  - Form validation
  - Data encryption
- **OrderTables (`OrderTables.js`)**:
  - Order book display
  - Real-time updates
  - Data sorting/filtering
- **PriceChart (`PriceChart.js`)**:
  - Price visualization
  - Chart rendering
  - Historical data display

## Data Flow

### Order Placement Flow
```
1. User Input → OrderForm
2. Client Encryption → JSEncrypt
3. API Request → /api/orders/place
4. Server Decryption → RSA Private Key
5. Validation → Input Sanitization
6. Database Insert → SQLite
7. Order Matching → Matching Engine
8. Trade Execution → Database Update
9. Response → Client
10. UI Update → Real-time Refresh
```

### Order Matching Flow
```
1. New Order → Pending Orders Table
2. Matching Trigger → Engine Process
3. Price/Time Sorting → Priority Algorithm
4. Match Detection → Cross Order Analysis
5. Trade Execution → Transaction
6. Order Updates → Partial/Fill/Delete
7. Logging → Winston Logger
8. Real-time Update → Frontend
```

## Database Schema

### Tables

#### `pending_orders`
```sql
CREATE TABLE pending_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_type TEXT NOT NULL CHECK (order_type IN ('buyer', 'seller')),
    quantity REAL NOT NULL CHECK (quantity > 0),
    price REAL NOT NULL CHECK (price > 0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `completed_orders`
```sql
CREATE TABLE completed_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    price REAL NOT NULL,
    quantity REAL NOT NULL,
    buyer_order_id INTEGER,
    seller_order_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_order_id) REFERENCES pending_orders(id),
    FOREIGN KEY (seller_order_id) REFERENCES pending_orders(id)
);
```

#### `system_config`
```sql
CREATE TABLE system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Security Architecture

### Encryption Layer
```
Client Side:
┌─────────────────┐
│   Order Data    │
└─────────┬───────┘
          │
┌─────────▼───────┐
│  RSA Public Key │
│   Encryption    │
└─────────┬───────┘
          │
┌─────────▼───────┐
│ Encrypted Data  │
└─────────────────┘

Server Side:
┌─────────────────┐
│ Encrypted Data  │
└─────────┬───────┘
          │
┌─────────▼───────┐
│  RSA Private    │
│   Key Decrypt   │
└─────────┬───────┘
          │
┌─────────▼───────┐
│   Order Data    │
└─────────────────┘
```

### Security Measures
1. **RSA Encryption**: End-to-end data protection
2. **Rate Limiting**: API abuse prevention
3. **CORS**: Cross-origin request control
4. **Helmet**: Security headers
5. **Input Validation**: Data sanitization
6. **SQL Injection Prevention**: Parameterized queries

## Performance Architecture

### Caching Strategy
```
┌─────────────────┐
│   Client Cache  │
│   (Browser)     │
└─────────────────┘
         │
┌─────────────────┐
│   API Cache     │
│   (Future)      │
└─────────────────┘
         │
┌─────────────────┐
│   Database      │
│   (SQLite)      │
└─────────────────┘
```

### Optimization Techniques
1. **Database Indexing**: Price and time-based queries
2. **Connection Pooling**: Efficient database connections
3. **Async Operations**: Non-blocking I/O
4. **Memory Management**: Efficient data structures
5. **Query Optimization**: Minimal database calls

## Scalability Considerations

### Horizontal Scaling
```
┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Load Balancer │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
┌─────────▼───────┐    ┌─────────▼───────┐
│   API Server 1  │    │   API Server 2  │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────────┬───────────┘
                     │
            ┌─────────▼─────────┐
            │   Shared Database │
            │   (PostgreSQL)    │
            └───────────────────┘
```

### Vertical Scaling
- **Memory**: Increase Node.js heap size
- **CPU**: Multi-core processing
- **Storage**: SSD optimization
- **Network**: Bandwidth optimization

## Monitoring & Observability

### Logging Strategy
```
┌─────────────────┐
│   Application   │
│     Logs        │
└─────────┬───────┘
          │
┌─────────▼───────┐
│   Winston       │
│   Logger        │
└─────────┬───────┘
          │
┌─────────▼───────┐    ┌─────────────────┐
│   Error Logs    │    │ Combined Logs   │
│   (error.log)   │    │ (combined.log)  │
└─────────────────┘    └─────────────────┘
```

### Health Monitoring
- **System Health**: `/health` endpoint
- **Database Health**: Connection monitoring
- **API Health**: Response time tracking
- **Error Tracking**: Exception monitoring

## Deployment Architecture

### Development Environment
```
┌─────────────────┐
│   Local Dev     │
│   Environment   │
└─────────────────┘
         │
┌─────────────────┐
│   SQLite DB     │
│   (File-based)  │
└─────────────────┘
```

### Production Environment
```
┌─────────────────┐
│   CDN           │
│   (Static)      │
└─────────────────┘
         │
┌─────────────────┐
│   Load Balancer │
└─────────┬───────┘
          │
┌─────────▼───────┐
│   API Servers   │
└─────────┬───────┘
          │
┌─────────▼───────┐
│   Database      │
│   (PostgreSQL)  │
└─────────────────┘
```

## Future Enhancements

### Planned Architecture Improvements
1. **Microservices**: Service decomposition
2. **Message Queue**: Redis/RabbitMQ integration
3. **WebSocket**: Real-time communication
4. **Caching**: Redis cache layer
5. **Monitoring**: Prometheus/Grafana
6. **Containerization**: Docker/Kubernetes

### Technology Migration Path
1. **Database**: SQLite → PostgreSQL
2. **Caching**: Memory → Redis
3. **Messaging**: HTTP → WebSocket
4. **Deployment**: Manual → Docker
5. **Monitoring**: Basic → Advanced 