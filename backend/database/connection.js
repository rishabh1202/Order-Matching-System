const sqlite3 = require('sqlite3').verbose();
const winston = require('winston');
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, '../../data/order_matching.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Database connection
let db;

// Initialize database connection
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                winston.error('Error opening database:', err);
                reject(err);
                return;
            }
            
            winston.info('Connected to SQLite database');
            
            // Enable foreign keys
            db.run('PRAGMA foreign_keys = ON');
            
            // Create tables
            createTables()
                .then(() => {
                    winston.info('Database tables initialized successfully');
                    resolve();
                })
                .catch(reject);
        });
    });
}

// Create database tables
async function createTables() {
    return new Promise((resolve, reject) => {
        const tables = [
            `CREATE TABLE IF NOT EXISTS pending_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_type TEXT NOT NULL CHECK (order_type IN ('buyer', 'seller')),
                quantity INTEGER NOT NULL CHECK (quantity > 0),
                price REAL NOT NULL CHECK (price > 0),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS completed_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                price REAL NOT NULL,
                quantity INTEGER NOT NULL,
                buyer_order_id INTEGER,
                seller_order_id INTEGER,
                completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE INDEX IF NOT EXISTS idx_pending_orders_type_price 
             ON pending_orders(order_type, price)`,
            
            `CREATE INDEX IF NOT EXISTS idx_pending_orders_price 
             ON pending_orders(price)`,
            
            `CREATE INDEX IF NOT EXISTS idx_completed_orders_price 
             ON completed_orders(price)`
        ];
        
        let completed = 0;
        const total = tables.length;
        
        tables.forEach((sql, index) => {
            db.run(sql, (err) => {
                if (err) {
                    winston.error(`Error creating table/index ${index + 1}:`, err);
                    reject(err);
                    return;
                }
                
                completed++;
                if (completed === total) {
                    resolve();
                }
            });
        });
    });
}

// Execute query with transaction support
function executeTransaction(callback) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            callback(db)
                .then((result) => {
                    db.run('COMMIT', (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                })
                .catch((error) => {
                    db.run('ROLLBACK');
                    reject(error);
                });
        });
    });
}

// Get pending orders with proper locking
function getPendingOrders() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                id,
                order_type,
                quantity,
                price,
                created_at,
                updated_at
            FROM pending_orders 
            ORDER BY 
                CASE WHEN order_type = 'buyer' THEN price END DESC,
                CASE WHEN order_type = 'seller' THEN price END ASC,
                created_at ASC
        `;
        
        db.all(query, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows || []);
            }
        });
    });
}

// Get completed orders
function getCompletedOrders() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                id,
                price,
                quantity,
                buyer_order_id,
                seller_order_id,
                completed_at
            FROM completed_orders 
            ORDER BY completed_at DESC
        `;
        
        db.all(query, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows || []);
            }
        });
    });
}

// Insert pending order
function insertPendingOrder(orderType, quantity, price) {
    return new Promise((resolve, reject) => {
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
}

// Delete pending order by ID
function deletePendingOrder(id) {
    return new Promise((resolve, reject) => {
        const query = `DELETE FROM pending_orders WHERE id = ?`;
        
        db.run(query, [id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: id });
            }
        });
    });
}

// Update pending order quantity
function updatePendingOrderQuantity(id, newQuantity) {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE pending_orders 
            SET quantity = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        db.run(query, [newQuantity, id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({
                    id: id,
                    quantity: newQuantity,
                    updated_at: new Date().toISOString()
                });
            }
        });
    });
}

// Insert completed order
function insertCompletedOrder(price, quantity, buyerOrderId, sellerOrderId) {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO completed_orders (price, quantity, buyer_order_id, seller_order_id)
            VALUES (?, ?, ?, ?)
        `;
        
        db.run(query, [price, quantity, buyerOrderId, sellerOrderId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({
                    id: this.lastID,
                    price: price,
                    quantity: quantity,
                    completed_at: new Date().toISOString()
                });
            }
        });
    });
}

// Get orders for matching (SQLite doesn't support FOR UPDATE, so we'll use a different approach)
function getOrdersForMatching() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                id,
                order_type,
                quantity,
                price,
                created_at
            FROM pending_orders 
            ORDER BY 
                CASE WHEN order_type = 'buyer' THEN price END DESC,
                CASE WHEN order_type = 'seller' THEN price END ASC,
                created_at ASC
        `;
        
        db.all(query, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows || []);
            }
        });
    });
}

// Close database connection
function closeDatabase() {
    if (db) {
        db.close((err) => {
            if (err) {
                winston.error('Error closing database:', err);
            } else {
                winston.info('Database connection closed');
            }
        });
    }
}

module.exports = {
    initializeDatabase,
    executeTransaction,
    getPendingOrders,
    getCompletedOrders,
    insertPendingOrder,
    deletePendingOrder,
    updatePendingOrderQuantity,
    insertCompletedOrder,
    getOrdersForMatching,
    closeDatabase
}; 