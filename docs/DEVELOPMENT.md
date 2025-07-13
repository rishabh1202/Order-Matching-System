# 👨‍💻 Development Guide

## Development Environment Setup

### Prerequisites
- **Node.js**: v24.4.0 or higher
- **npm**: v11.4.2 or higher
- **Git**: Latest version
- **Code Editor**: VS Code (recommended)
- **Database**: SQLite (included)

### VS Code Extensions (Recommended)
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

## Project Structure

```
Order-Matching-S/
├── backend/                 # Backend API server
│   ├── server.js           # Main server file
│   ├── routes/             # API routes
│   │   └── orders.js       # Order management routes
│   ├── services/           # Business logic
│   │   └── orderMatchingEngine.js
│   ├── middleware/         # Express middleware
│   │   ├── encryption.js   # RSA encryption
│   │   └── errorHandler.js # Error handling
│   └── database/           # Database layer
│       └── connection.js   # SQLite connection
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── OrderForm.js
│   │   │   ├── OrderTables.js
│   │   │   └── PriceChart.js
│   │   ├── App.js         # Main app component
│   │   └── index.js       # Entry point
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── mobile/                # Mobile application
├── docs/                  # Documentation
├── logs/                  # Application logs
├── data/                  # Database files
├── package.json           # Root dependencies
├── start.bat             # Windows startup script
├── start.sh              # Linux/Mac startup script
└── docker-compose.yml    # Docker configuration
```

## Getting Started

### 1. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd Order-Matching-S

# Install all dependencies
npm run install-all

# Setup database
npm run setup-db
```

### 2. Development Mode
```bash
# Start backend in development mode
npm run dev

# Start frontend (in new terminal)
cd frontend && npm start

# Start mobile (in new terminal)
cd mobile && npm start
```

### 3. Production Build
```bash
# Build frontend
cd frontend && npm run build

# Start production server
npm start
```

## Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# ... code changes ...

# Test changes
npm test

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/new-feature
```

### 2. Code Quality
```bash
# Run linting
npm run lint

# Run formatting
npm run format

# Run tests
npm test

# Check for security vulnerabilities
npm audit
```

### 3. Database Changes
```bash
# Reset database
rm -rf data/orders.db
npm run setup-db

# View database
sqlite3 data/orders.db
```

## API Development

### Adding New Endpoints

1. **Create Route Handler** (`backend/routes/newFeature.js`):
```javascript
const express = require('express');
const router = express.Router();

// GET endpoint
router.get('/new-endpoint', async (req, res) => {
  try {
    // Implementation
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST endpoint
router.post('/new-endpoint', async (req, res) => {
  try {
    const { data } = req.body;
    // Implementation
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
```

2. **Register Route** (`backend/server.js`):
```javascript
const newFeatureRoutes = require('./routes/newFeature');
app.use('/api/new-feature', newFeatureRoutes);
```

### Middleware Development

**Custom Middleware** (`backend/middleware/customMiddleware.js`):
```javascript
const customMiddleware = (req, res, next) => {
  // Middleware logic
  console.log('Custom middleware executed');
  next();
};

module.exports = customMiddleware;
```

**Apply Middleware** (`backend/server.js`):
```javascript
const customMiddleware = require('./middleware/customMiddleware');
app.use('/api/protected', customMiddleware);
```

## Frontend Development

### Component Development

**New Component** (`frontend/src/components/NewComponent.js`):
```javascript
import React, { useState, useEffect } from 'react';
import './NewComponent.css';

const NewComponent = ({ prop1, prop2, onAction }) => {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Component initialization
  }, []);

  const handleClick = () => {
    onAction && onAction();
  };

  return (
    <div className="new-component">
      <h3>New Component</h3>
      <button onClick={handleClick}>Action</button>
    </div>
  );
};

export default NewComponent;
```

**Component Styling** (`frontend/src/components/NewComponent.css`):
```css
.new-component {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.new-component button {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}
```

### State Management

**Context API** (`frontend/src/context/AppContext.js`):
```javascript
import React, { createContext, useContext, useReducer } from 'react';

const AppContext = createContext();

const initialState = {
  orders: [],
  loading: false,
  error: null
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
```

## Testing

### Backend Testing

**Unit Test** (`backend/__tests__/orderMatchingEngine.test.js`):
```javascript
const OrderMatchingEngine = require('../services/orderMatchingEngine');

describe('OrderMatchingEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new OrderMatchingEngine();
  });

  test('should match orders correctly', async () => {
    const buyerOrder = { orderType: 'buyer', quantity: 100, price: 50 };
    const sellerOrder = { orderType: 'seller', quantity: 100, price: 45 };

    const result = await engine.addOrder(buyerOrder.orderType, buyerOrder.quantity, buyerOrder.price);
    expect(result.success).toBe(true);
  });
});
```

**API Test** (`backend/__tests__/orders.test.js`):
```javascript
const request = require('supertest');
const app = require('../server');

describe('Orders API', () => {
  test('GET /api/orders/pending should return pending orders', async () => {
    const response = await request(app)
      .get('/api/orders/pending')
      .expect(200);

    expect(response.body).toHaveProperty('orders');
    expect(Array.isArray(response.body.orders)).toBe(true);
  });
});
```

### Frontend Testing

**Component Test** (`frontend/src/components/__tests__/OrderForm.test.js`):
```javascript
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import OrderForm from '../OrderForm';

describe('OrderForm', () => {
  const mockOnPlaceOrder = jest.fn();

  beforeEach(() => {
    mockOnPlaceOrder.mockClear();
  });

  test('should render form fields', () => {
    render(<OrderForm onPlaceOrder={mockOnPlaceOrder} />);
    
    expect(screen.getByLabelText(/order type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
  });

  test('should call onPlaceOrder when form is submitted', () => {
    render(<OrderForm onPlaceOrder={mockOnPlaceOrder} />);
    
    fireEvent.click(screen.getByText(/place order/i));
    expect(mockOnPlaceOrder).toHaveBeenCalled();
  });
});
```

## Debugging

### Backend Debugging

**Debug Mode**:
```bash
# Start with debugging
node --inspect backend/server.js

# Or with nodemon
nodemon --inspect backend/server.js
```

**Logging**:
```javascript
const winston = require('winston');

// Add debug logging
winston.debug('Debug message');
winston.info('Info message');
winston.warn('Warning message');
winston.error('Error message');
```

### Frontend Debugging

**React DevTools**: Install browser extension for component inspection

**Console Debugging**:
```javascript
// Add debug points
console.log('Debug data:', data);
console.table(arrayData);
console.group('Grouped logs');
console.groupEnd();
```

**Error Boundaries**:
```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
```

## Performance Optimization

### Backend Optimization

**Database Queries**:
```javascript
// Use prepared statements
const query = 'SELECT * FROM orders WHERE price > ? AND quantity > ?';
db.all(query, [minPrice, minQuantity], (err, rows) => {
  // Handle results
});

// Use transactions for multiple operations
await executeTransaction(async (db) => {
  // Multiple database operations
});
```

**Caching**:
```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

const getCachedData = (key) => {
  let data = cache.get(key);
  if (!data) {
    data = fetchFromDatabase();
    cache.set(key, data);
  }
  return data;
};
```

### Frontend Optimization

**React Optimization**:
```javascript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Component content */}</div>;
});

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Use useCallback for function props
const handleClick = useCallback(() => {
  // Handle click
}, [dependencies]);
```

**Bundle Optimization**:
```javascript
// Code splitting
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// Dynamic imports
const loadModule = async () => {
  const module = await import('./HeavyModule');
  return module.default;
};
```

## Security Best Practices

### Backend Security

**Input Validation**:
```javascript
const Joi = require('joi');

const orderSchema = Joi.object({
  orderType: Joi.string().valid('buyer', 'seller').required(),
  quantity: Joi.number().positive().required(),
  price: Joi.number().positive().required()
});

const validateOrder = (data) => {
  return orderSchema.validate(data);
};
```

**SQL Injection Prevention**:
```javascript
// Always use parameterized queries
const query = 'INSERT INTO orders (type, quantity, price) VALUES (?, ?, ?)';
db.run(query, [orderType, quantity, price]);
```

### Frontend Security

**XSS Prevention**:
```javascript
// Sanitize user input
import DOMPurify from 'dompurify';

const sanitizedHtml = DOMPurify.sanitize(userInput);
```

**CSRF Protection**:
```javascript
// Include CSRF token in requests
const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

axios.defaults.headers.common['X-CSRF-Token'] = csrfToken;
```

## Deployment

### Environment Configuration

**Development** (`.env.development`):
```env
NODE_ENV=development
PORT=5000
DB_PATH=./data/orders-dev.db
LOG_LEVEL=debug
```

**Production** (`.env.production`):
```env
NODE_ENV=production
PORT=5000
DB_PATH=./data/orders.db
LOG_LEVEL=error
FRONTEND_URL=https://yourdomain.com
```

### Build Process

**Frontend Build**:
```bash
cd frontend
npm run build
```

**Backend Build**:
```bash
# No build step needed for Node.js
# Just ensure all dependencies are installed
npm install --production
```

### Docker Deployment

**Build Image**:
```bash
docker build -t order-matching-system .
```

**Run Container**:
```bash
docker run -p 5000:5000 order-matching-system
```

## Troubleshooting

### Common Issues

**Port Already in Use**:
```bash
# Find process
netstat -ano | findstr :5000

# Kill process
taskkill /PID <process_id> /F
```

**Database Locked**:
```bash
# Close all connections and restart
rm -rf data/orders.db
npm run setup-db
```

**Node Modules Issues**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Frontend Build Issues**:
```bash
# Clear build cache
cd frontend
rm -rf build node_modules
npm install
npm run build
```

### Performance Issues

**Memory Leaks**:
```bash
# Monitor memory usage
node --inspect --max-old-space-size=4096 backend/server.js
```

**Slow Queries**:
```bash
# Enable query logging
sqlite3 data/orders.db "PRAGMA query_only = 0;"
```

## Contributing Guidelines

### Code Style

**JavaScript/Node.js**:
- Use ES6+ features
- Prefer `const` and `let` over `var`
- Use async/await over callbacks
- Follow camelCase naming

**React**:
- Use functional components with hooks
- Follow PascalCase for component names
- Use prop-types for type checking
- Keep components small and focused

### Git Workflow

**Commit Messages**:
```
feat: add new order matching algorithm
fix: resolve database connection issue
docs: update API documentation
style: format code according to style guide
refactor: restructure order processing logic
test: add unit tests for matching engine
chore: update dependencies
```

**Branch Naming**:
- `feature/new-feature`
- `bugfix/issue-description`
- `hotfix/critical-fix`
- `docs/documentation-update`

### Pull Request Process

1. **Create Feature Branch**
2. **Make Changes**
3. **Add Tests**
4. **Update Documentation**
5. **Run Linting**
6. **Submit PR**
7. **Code Review**
8. **Merge**

---

**Happy Coding! 🚀** 