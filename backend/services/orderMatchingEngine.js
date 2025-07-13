const winston = require('winston');
const {
  executeTransaction,
  getOrdersForMatching,
  deletePendingOrder,
  updatePendingOrderQuantity,
  insertCompletedOrder
} = require('../database/connection');

class OrderMatchingEngine {
  constructor() {
    this.isProcessing = false;
  }

  // Main matching function
  async matchOrders() {
    if (this.isProcessing) {
      winston.warn('Order matching already in progress, skipping...');
      return;
    }

    this.isProcessing = true;

    try {
      await executeTransaction(async (db) => {
        const orders = await getOrdersForMatching();
        await this.processMatching(orders, db);
      });

      winston.info('Order matching completed successfully');
    } catch (error) {
      winston.error('Error in order matching:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  // Process matching logic
  async processMatching(orders, db) {
    const buyers = orders.filter(order => order.order_type === 'buyer');
    const sellers = orders.filter(order => order.order_type === 'seller');

    // Sort buyers by price (highest first) and time (earliest first)
    buyers.sort((a, b) => {
      if (a.price !== b.price) {
        return b.price - a.price;
      }
      return new Date(a.created_at) - new Date(b.created_at);
    });

    // Sort sellers by price (lowest first) and time (earliest first)
    sellers.sort((a, b) => {
      if (a.price !== b.price) {
        return a.price - b.price;
      }
      return new Date(a.created_at) - new Date(b.created_at);
    });

    let matches = [];

    // Find matches
    for (let buyer of buyers) {
      for (let seller of sellers) {
        // Check if buyer price >= seller price (match condition)
        if (buyer.price >= seller.price && buyer.quantity > 0 && seller.quantity > 0) {
          const matchQuantity = Math.min(buyer.quantity, seller.quantity);
          const matchPrice = seller.price; // Price priority to seller

          matches.push({
            buyerId: buyer.id,
            sellerId: seller.id,
            quantity: matchQuantity,
            price: matchPrice,
            buyerRemaining: buyer.quantity - matchQuantity,
            sellerRemaining: seller.quantity - matchQuantity
          });

          // Update remaining quantities
          buyer.quantity -= matchQuantity;
          seller.quantity -= matchQuantity;

          // If either order is fully filled, break inner loop
          if (buyer.quantity === 0) break;
        }
      }
    }

    // Execute matches
    await this.executeMatches(matches, db);
  }

  // Execute the matches
  async executeMatches(matches, db) {
    for (let match of matches) {
      try {
        // Insert completed order
        await new Promise((resolve, reject) => {
          const query = `
            INSERT INTO completed_orders (price, quantity, buyer_order_id, seller_order_id)
            VALUES (?, ?, ?, ?)
          `;
          
          db.run(query, [match.price, match.quantity, match.buyerId, match.sellerId], function(err) {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });

        winston.info(`Match executed: ${match.quantity} units at ${match.price}`);

        // Update or delete buyer order
        if (match.buyerRemaining > 0) {
          await new Promise((resolve, reject) => {
            const query = `
              UPDATE pending_orders 
              SET quantity = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `;
            
            db.run(query, [match.buyerRemaining, match.buyerId], function(err) {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
        } else {
          await new Promise((resolve, reject) => {
            const query = `DELETE FROM pending_orders WHERE id = ?`;
            
            db.run(query, [match.buyerId], function(err) {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
        }

        // Update or delete seller order
        if (match.sellerRemaining > 0) {
          await new Promise((resolve, reject) => {
            const query = `
              UPDATE pending_orders 
              SET quantity = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `;
            
            db.run(query, [match.sellerRemaining, match.sellerId], function(err) {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
        } else {
          await new Promise((resolve, reject) => {
            const query = `DELETE FROM pending_orders WHERE id = ?`;
            
            db.run(query, [match.sellerId], function(err) {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
        }

      } catch (error) {
        winston.error('Error executing match:', error);
        throw error;
      }
    }
  }

  // Add new order and trigger matching
  async addOrder(orderType, quantity, price) {
    try {
      // Validate input
      if (!['buyer', 'seller'].includes(orderType)) {
        throw new Error('Invalid order type. Must be "buyer" or "seller"');
      }

      if (quantity <= 0 || price <= 0) {
        throw new Error('Quantity and price must be positive numbers');
      }

      // Insert the order
      const result = await executeTransaction(async (db) => {
        const insertResult = await new Promise((resolve, reject) => {
          const query = `
            INSERT INTO pending_orders (order_type, quantity, price)
            VALUES (?, ?, ?)
          `;
          
          db.run(query, [orderType, quantity, price], function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({
                id: this.lastID,
                order_type: orderType,
                quantity: quantity,
                price: price,
                created_at: new Date().toISOString()
              });
            }
          });
        });

        // Trigger matching
        await this.matchOrders();

        return insertResult;
      });

      winston.info(`Order added: ${orderType} ${quantity} units at ${price}`);
      return result;

    } catch (error) {
      winston.error('Error adding order:', error);
      throw error;
    }
  }

  // Get order book (pending orders formatted for display)
  async getOrderBook() {
    try {
      const orders = await getOrdersForMatching();
      
      const buyers = orders
        .filter(order => order.order_type === 'buyer')
        .sort((a, b) => b.price - a.price);

      const sellers = orders
        .filter(order => order.order_type === 'seller')
        .sort((a, b) => a.price - b.price);

      return {
        buyers,
        sellers,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      winston.error('Error getting order book:', error);
      throw error;
    }
  }

  // Get market depth (aggregated by price)
  async getMarketDepth() {
    try {
      const orders = await getOrdersForMatching();
      
      const depth = {};
      
      orders.forEach(order => {
        const price = order.price;
        if (!depth[price]) {
          depth[price] = { buyer: 0, seller: 0 };
        }
        depth[price][order.order_type] += order.quantity;
      });

      return depth;

    } catch (error) {
      winston.error('Error getting market depth:', error);
      throw error;
    }
  }
}

module.exports = new OrderMatchingEngine(); 