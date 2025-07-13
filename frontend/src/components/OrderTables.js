import React, { useState } from 'react';
import toast from 'react-hot-toast';

const OrderTables = ({ pendingOrders, completedOrders, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('pending');

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const getOrderTypeBadge = (orderType) => {
    return (
      <span className={`badge badge-${orderType}`}>
        {orderType === 'buyer' ? '🟢 Buy' : '🔴 Sell'}
      </span>
    );
  };

  const handleRefresh = () => {
    onRefresh();
    toast.success('Order book refreshed!');
  };

  return (
    <div className="order-tables">
      {/* Tab Navigation */}
      <div className="tab-navigation mb-4">
        <button
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          📋 Pending Orders ({pendingOrders.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          ✅ Completed Orders ({completedOrders.length})
        </button>
        <button
          className="btn btn-primary"
          onClick={handleRefresh}
          style={{ marginLeft: 'auto' }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Pending Orders Tab */}
      {activeTab === 'pending' && (
        <div className="tab-content">
          {pendingOrders.length === 0 ? (
            <div className="empty-state">
              <p>No pending orders</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total Value</th>
                    <th>Created</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{getOrderTypeBadge(order.orderType)}</td>
                      <td>{order.quantity.toLocaleString()}</td>
                      <td className="price-cell">{formatPrice(order.price)}</td>
                      <td className="value-cell">
                        {formatPrice(order.quantity * order.price)}
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>{formatDate(order.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Completed Orders Tab */}
      {activeTab === 'completed' && (
        <div className="tab-content">
          {completedOrders.length === 0 ? (
            <div className="empty-state">
              <p>No completed orders</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total Value</th>
                    <th>Buyer Order ID</th>
                    <th>Seller Order ID</th>
                    <th>Completed At</th>
                  </tr>
                </thead>
                <tbody>
                  {completedOrders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td className="price-cell">{formatPrice(order.price)}</td>
                      <td>{order.quantity.toLocaleString()}</td>
                      <td className="value-cell">
                        {formatPrice(order.quantity * order.price)}
                      </td>
                      <td>
                        {order.buyerOrderId ? `#${order.buyerOrderId}` : 'N/A'}
                      </td>
                      <td>
                        {order.sellerOrderId ? `#${order.sellerOrderId}` : 'N/A'}
                      </td>
                      <td>{formatDate(order.completedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Summary Statistics */}
      <div className="summary-stats mt-4">
        <div className="stat-card">
          <h4>📊 Summary</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Pending Orders:</span>
              <span className="stat-value">{pendingOrders.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Completed Orders:</span>
              <span className="stat-value">{completedOrders.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Volume:</span>
              <span className="stat-value">
                {completedOrders.reduce((sum, order) => sum + order.quantity, 0).toLocaleString()}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Value:</span>
              <span className="stat-value">
                {formatPrice(
                  completedOrders.reduce((sum, order) => sum + (order.quantity * order.price), 0)
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTables; 