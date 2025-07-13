const axios = require('axios');
const JSEncrypt = require('jsencrypt');

const API_BASE_URL = 'http://localhost:3000/api/orders';

// Test configuration
const testConfig = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testHealthCheck() {
  try {
    log('🔍 Testing health check...', 'blue');
    const response = await axios.get('http://localhost:3000/health', testConfig);
    
    if (response.status === 200) {
      log('✅ Health check passed', 'green');
      return true;
    } else {
      log('❌ Health check failed', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Health check failed: ${error.message}`, 'red');
    return false;
  }
}

async function testPublicKey() {
  try {
    log('🔑 Testing public key retrieval...', 'blue');
    const response = await axios.get(`${API_BASE_URL}/public-key`, testConfig);
    
    if (response.status === 200 && response.data.publicKey) {
      log('✅ Public key retrieved successfully', 'green');
      return response.data.publicKey;
    } else {
      log('❌ Public key retrieval failed', 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Public key retrieval failed: ${error.message}`, 'red');
    return null;
  }
}

async function testOrderPlacement(publicKey) {
  try {
    log('📝 Testing order placement...', 'blue');
    
    // Test data
    const orderData = {
      orderType: 'buyer',
      quantity: 50,
      price: 100.50
    };
    
    // Encrypt the order data
    const encrypt = new JSEncrypt();
    encrypt.setPublicKey(publicKey);
    const encryptedData = encrypt.encrypt(JSON.stringify(orderData));
    
    if (!encryptedData) {
      log('❌ Encryption failed', 'red');
      return false;
    }
    
    const response = await axios.post(`${API_BASE_URL}/place`, {
      encryptedData
    }, testConfig);
    
    if (response.status === 201 && response.data.success) {
      log('✅ Order placed successfully', 'green');
      return true;
    } else {
      log('❌ Order placement failed', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Order placement failed: ${error.message}`, 'red');
    return false;
  }
}

async function testGetOrders() {
  try {
    log('📊 Testing order retrieval...', 'blue');
    
    const [pendingResponse, completedResponse] = await Promise.all([
      axios.get(`${API_BASE_URL}/pending`, testConfig),
      axios.get(`${API_BASE_URL}/completed`, testConfig)
    ]);
    
    if (pendingResponse.status === 200 && completedResponse.status === 200) {
      log(`✅ Orders retrieved successfully - Pending: ${pendingResponse.data.orders?.length || 0}, Completed: ${completedResponse.data.orders?.length || 0}`, 'green');
      return true;
    } else {
      log('❌ Order retrieval failed', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Order retrieval failed: ${error.message}`, 'red');
    return false;
  }
}

async function testOrderBook() {
  try {
    log('📈 Testing order book...', 'blue');
    const response = await axios.get(`${API_BASE_URL}/orderbook`, testConfig);
    
    if (response.status === 200 && response.data.success) {
      const { buyers, sellers } = response.data.orderBook;
      log(`✅ Order book retrieved - Buyers: ${buyers?.length || 0}, Sellers: ${sellers?.length || 0}`, 'green');
      return true;
    } else {
      log('❌ Order book retrieval failed', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Order book retrieval failed: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('🚀 Starting Order Matching System Tests', 'yellow');
  log('=====================================', 'yellow');
  
  const results = {
    healthCheck: false,
    publicKey: false,
    orderPlacement: false,
    getOrders: false,
    orderBook: false
  };
  
  // Test 1: Health Check
  results.healthCheck = await testHealthCheck();
  
  if (!results.healthCheck) {
    log('❌ System is not running. Please start the backend server first.', 'red');
    return;
  }
  
  // Test 2: Public Key
  const publicKey = await testPublicKey();
  results.publicKey = !!publicKey;
  
  if (!results.publicKey) {
    log('❌ Cannot proceed without public key', 'red');
    return;
  }
  
  // Test 3: Order Placement
  results.orderPlacement = await testOrderPlacement(publicKey);
  
  // Test 4: Get Orders
  results.getOrders = await testGetOrders();
  
  // Test 5: Order Book
  results.orderBook = await testOrderBook();
  
  // Summary
  log('\n📋 Test Results Summary', 'yellow');
  log('====================', 'yellow');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${status} ${test}`, color);
  });
  
  log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? 'green' : 'red');
  
  if (passedTests === totalTests) {
    log('🎉 All tests passed! The Order Matching System is working correctly.', 'green');
  } else {
    log('⚠️  Some tests failed. Please check the system configuration.', 'yellow');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    log(`💥 Test execution failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  testHealthCheck,
  testPublicKey,
  testOrderPlacement,
  testGetOrders,
  testOrderBook,
  runAllTests
}; 