import React, { useState, useEffect } from 'react';
import axios from 'axios';
import JSEncrypt from 'jsencrypt';
import toast from 'react-hot-toast';
import OrderForm from './components/OrderForm';
import OrderTables from './components/OrderTables';
import PriceChart from './components/PriceChart';
import './App.css';

function App() {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [publicKey, setPublicKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(null);


  

  // Initialize encryption and fetch data
  useEffect(() => {
    initializeApp();
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  const initializeApp = async () => {
    try {
      // Get public key for encryption
      const keyResponse = await axios.get('/api/orders/public-key');
      setPublicKey(keyResponse.data.publicKey);

      // Fetch initial data
      await fetchOrders();

      // Set up auto-refresh every 5 seconds
      const interval = setInterval(fetchOrders, 5000);
      setRefreshInterval(interval);

      setLoading(false);
      toast.success('Order Matching System connected!');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      toast.error('Failed to connect to server');
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const [pendingResponse, completedResponse] = await Promise.all([
        axios.get('/api/orders/pending'),
        axios.get('/api/orders/completed')
      ]);

      setPendingOrders(pendingResponse.data.orders || []);
      setCompletedOrders(completedResponse.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const placeOrder = async (orderData) => {
    try {
      // Encrypt the order data
      const encrypt = new JSEncrypt();
      encrypt.setPublicKey(publicKey);
      
      const encryptedData = encrypt.encrypt(JSON.stringify(orderData));
      
      if (!encryptedData) {
        throw new Error('Encryption failed');
      }

      const response = await axios.post('/api/orders/place', {
        encryptedData
      });

      if (response.data.success) {
        toast.success('Order placed successfully!');
        await fetchOrders(); // Refresh data immediately
      } else {
        throw new Error(response.data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2>Connecting to Order Matching System...</h2>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <div className="container">
          <h1>📊 Order Matching System</h1>
          <p>Real-time trading platform with secure encryption</p>
        </div>
      </header>

      <main className="container">
        <div className="grid grid-cols-2 gap-4">
          {/* Order Form */}
          <div className="card">
            <h2>Place New Order</h2>
            <OrderForm onPlaceOrder={placeOrder} />
          </div>

          {/* Price Chart */}
          <div className="card">
            <h2>Price Chart</h2>
            <PriceChart completedOrders={completedOrders} />
          </div>
        </div>

        {/* Order Tables */}
        <div className="card">
          <h2>Order Book</h2>
          <OrderTables 
            pendingOrders={pendingOrders} 
            completedOrders={completedOrders}
            onRefresh={fetchOrders}
          />
        </div>
      </main>

      <footer className="app-footer">
        <div className="container">
          <p>&copy; 2024 Order Matching System. Built with React & Node.js</p>
        </div>
      </footer>
    </div>
  );
}

export default App; 