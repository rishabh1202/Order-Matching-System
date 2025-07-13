const express = require('express');
const router = express.Router();
const winston = require('winston');

const orderMatchingEngine = require('../services/orderMatchingEngine');
const { getPendingOrders, getCompletedOrders } = require('../database/connection');
const { getPublicKey } = require('../middleware/encryption');

// Validation middleware
const validateOrder = (req, res, next) => {
  const { orderType, quantity, price } = req.body;

  if (!orderType || !['buyer', 'seller'].includes(orderType)) {
    return res.status(400).json({
      error: 'Invalid order type',
      message: 'Order type must be "buyer" or "seller"'
    });
  }

  if (!quantity || quantity <= 0 || !Number.isInteger(Number(quantity))) {
    return res.status(400).json({
      error: 'Invalid quantity',
      message: 'Quantity must be a positive integer'
    });
  }

  if (!price || price <= 0 || isNaN(Number(price))) {
    return res.status(400).json({
      error: 'Invalid price',
      message: 'Price must be a positive number'
    });
  }

  next();
};

// Get public key for encryption
router.get('/public-key', (req, res) => {
  try {
    const publicKey = getPublicKey();
    res.json({ publicKey });
  } catch (error) {
    winston.error('Error getting public key:', error);
    res.status(500).json({ error: 'Failed to get public key' });
  }
});

// Place a new order
router.post('/place', validateOrder, async (req, res) => {
  try {
    const { orderType, quantity, price } = req.body;
    
    winston.info(`Placing ${orderType} order: ${quantity} units at ${price}`);
    
    const result = await orderMatchingEngine.addOrder(orderType, quantity, price);
    
    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: result
    });
    
  } catch (error) {
    winston.error('Error placing order:', error);
    res.status(500).json({
      error: 'Failed to place order',
      message: error.message
    });
  }
});

// Get pending orders
router.get('/pending', async (req, res) => {
  try {
    const orders = await getPendingOrders();
    
    // Format for frontend display
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderType: order.order_type,
      quantity: order.quantity,
      price: parseFloat(order.price),
      createdAt: order.created_at,
      updatedAt: order.updated_at
    }));
    
    res.json({
      success: true,
      orders: formattedOrders
    });
    
  } catch (error) {
    winston.error('Error getting pending orders:', error);
    res.status(500).json({
      error: 'Failed to get pending orders',
      message: error.message
    });
  }
});

// Get completed orders
router.get('/completed', async (req, res) => {
  try {
    const orders = await getCompletedOrders();
    
    // Format for frontend display
    const formattedOrders = orders.map(order => ({
      id: order.id,
      price: parseFloat(order.price),
      quantity: order.quantity,
      buyerOrderId: order.buyer_order_id,
      sellerOrderId: order.seller_order_id,
      completedAt: order.completed_at
    }));
    
    res.json({
      success: true,
      orders: formattedOrders
    });
    
  } catch (error) {
    winston.error('Error getting completed orders:', error);
    res.status(500).json({
      error: 'Failed to get completed orders',
      message: error.message
    });
  }
});

// Get order book (buyers and sellers)
router.get('/orderbook', async (req, res) => {
  try {
    const orderBook = await orderMatchingEngine.getOrderBook();
    
    res.json({
      success: true,
      orderBook
    });
    
  } catch (error) {
    winston.error('Error getting order book:', error);
    res.status(500).json({
      error: 'Failed to get order book',
      message: error.message
    });
  }
});

// Get market depth
router.get('/market-depth', async (req, res) => {
  try {
    const marketDepth = await orderMatchingEngine.getMarketDepth();
    
    res.json({
      success: true,
      marketDepth
    });
    
  } catch (error) {
    winston.error('Error getting market depth:', error);
    res.status(500).json({
      error: 'Failed to get market depth',
      message: error.message
    });
  }
});

// Get all orders (pending and completed)
router.get('/all', async (req, res) => {
  try {
    const [pendingOrders, completedOrders] = await Promise.all([
      getPendingOrders(),
      getCompletedOrders()
    ]);
    
    res.json({
      success: true,
      pending: pendingOrders.map(order => ({
        id: order.id,
        orderType: order.order_type,
        quantity: order.quantity,
        price: parseFloat(order.price),
        createdAt: order.created_at,
        updatedAt: order.updated_at
      })),
      completed: completedOrders.map(order => ({
        id: order.id,
        price: parseFloat(order.price),
        quantity: order.quantity,
        buyerOrderId: order.buyer_order_id,
        sellerOrderId: order.seller_order_id,
        completedAt: order.completed_at
      }))
    });
    
  } catch (error) {
    winston.error('Error getting all orders:', error);
    res.status(500).json({
      error: 'Failed to get orders',
      message: error.message
    });
  }
});

// Health check for orders service
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Order Matching Service',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 