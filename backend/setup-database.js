const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const dbPath = path.join(__dirname, '../data/order_matching.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

async function setupDatabase() {
    return new Promise((resolve, reject) => {
        console.log('Setting up SQLite database...');
        
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                reject(err);
                return;
            }
            
            console.log('Connected to SQLite database');
            
            // Enable foreign keys
            db.run('PRAGMA foreign_keys = ON');
            
            // Create tables first
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
                )`
            ];
            
            let tableCompleted = 0;
            const totalTables = tables.length;
            
            tables.forEach((sql, index) => {
                db.run(sql, (err) => {
                    if (err) {
                        console.error(`Error creating table ${index + 1}:`, err);
                        reject(err);
                        return;
                    }
                    
                    tableCompleted++;
                    if (tableCompleted === totalTables) {
                        // Create indexes after tables
                        createIndexes(db)
                            .then(() => {
                                // Insert sample data
                                return insertSampleData(db);
                            })
                            .then(() => {
                                console.log('Database setup completed successfully!');
                                console.log('Sample data inserted:');
                                console.log('- 5 buyer orders');
                                console.log('- 5 seller orders');
                                console.log('- 1 completed order');
                                db.close();
                                resolve();
                            })
                            .catch(reject);
                    }
                });
            });
        });
    });
}

function createIndexes(db) {
    return new Promise((resolve, reject) => {
        const indexes = [
            `CREATE INDEX IF NOT EXISTS idx_pending_orders_type_price 
             ON pending_orders(order_type, price)`,
            
            `CREATE INDEX IF NOT EXISTS idx_pending_orders_price 
             ON pending_orders(price)`,
            
            `CREATE INDEX IF NOT EXISTS idx_completed_orders_price 
             ON completed_orders(price)`
        ];
        
        let completed = 0;
        const total = indexes.length;
        
        indexes.forEach((sql, index) => {
            db.run(sql, (err) => {
                if (err) {
                    console.error(`Error creating index ${index + 1}:`, err);
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

function insertSampleData(db) {
    return new Promise((resolve, reject) => {
        // Clear existing data
        db.run('DELETE FROM pending_orders', (err) => {
            if (err) {
                reject(err);
                return;
            }
            
            db.run('DELETE FROM completed_orders', (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                // Sample data
                const sampleData = [
                    { order_type: 'buyer', quantity: 10, price: 99 },
                    { order_type: 'buyer', quantity: 50, price: 98 },
                    { order_type: 'buyer', quantity: 70, price: 97 },
                    { order_type: 'buyer', quantity: 80, price: 96 },
                    { order_type: 'buyer', quantity: 10, price: 96 },
                    { order_type: 'seller', quantity: 20, price: 100 },
                    { order_type: 'seller', quantity: 20, price: 101 },
                    { order_type: 'seller', quantity: 130, price: 102 },
                    { order_type: 'seller', quantity: 150, price: 103 },
                    { order_type: 'seller', quantity: 70, price: 104 }
                ];
                
                let inserted = 0;
                const total = sampleData.length;
                
                sampleData.forEach((data, index) => {
                    const query = `
                        INSERT INTO pending_orders (order_type, quantity, price)
                        VALUES (?, ?, ?)
                    `;
                    
                    db.run(query, [data.order_type, data.quantity, data.price], (err) => {
                        if (err) {
                            console.error(`Error inserting sample data ${index + 1}:`, err);
                            reject(err);
                            return;
                        }
                        
                        inserted++;
                        if (inserted === total) {
                            // Insert one completed order as example
                            db.run(`
                                INSERT INTO completed_orders (price, quantity, buyer_order_id, seller_order_id)
                                VALUES (?, ?, ?, ?)
                            `, [100.5, 50, null, null], (err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        }
                    });
                });
            });
        });
    });
}

// Run setup if this file is executed directly
if (require.main === module) {
    setupDatabase()
        .then(() => {
            console.log('Setup completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Setup failed:', error);
            process.exit(1);
        });
}

module.exports = { setupDatabase }; 