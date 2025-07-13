import React, { useState } from 'react';
import toast from 'react-hot-toast';

const OrderForm = ({ onPlaceOrder }) => {
  const [formData, setFormData] = useState({
    orderType: 'buyer',
    quantity: '',
    price: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.quantity || !formData.price) {
      toast.error('Please fill in all fields');
      return;
    }

    const quantity = parseInt(formData.quantity);
    const price = parseFloat(formData.price);

    if (quantity <= 0 || price <= 0) {
      toast.error('Quantity and price must be positive numbers');
      return;
    }

    if (quantity > 10000) {
      toast.error('Quantity cannot exceed 10,000');
      return;
    }

    if (price > 10000) {
      toast.error('Price cannot exceed 10,000');
      return;
    }

    setLoading(true);

    try {
      await onPlaceOrder({
        orderType: formData.orderType,
        quantity: quantity,
        price: price
      });

      // Reset form
      setFormData({
        orderType: 'buyer',
        quantity: '',
        price: ''
      });
    } catch (error) {
      console.error('Error placing order:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="order-form">
      <div className="form-group">
        <label className="form-label">Order Type</label>
        <select
          name="orderType"
          value={formData.orderType}
          onChange={handleChange}
          className="form-select"
          disabled={loading}
        >
          <option value="buyer">Buy Order</option>
          <option value="seller">Sell Order</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Quantity</label>
        <input
          type="number"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
          className="form-input"
          placeholder="Enter quantity"
          min="1"
          max="10000"
          disabled={loading}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Price</label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          className="form-input"
          placeholder="Enter price"
          min="0.01"
          max="10000"
          step="0.01"
          disabled={loading}
          required
        />
      </div>

      <button
        type="submit"
        className={`btn ${formData.orderType === 'buyer' ? 'btn-success' : 'btn-danger'}`}
        disabled={loading}
      >
        {loading ? (
          <span>Placing Order...</span>
        ) : (
          <span>
            {formData.orderType === 'buyer' ? '🟢' : '🔴'} Place {formData.orderType === 'buyer' ? 'Buy' : 'Sell'} Order
          </span>
        )}
      </button>

      <div className="form-info">
        <p>
          <strong>Order Type:</strong> {formData.orderType === 'buyer' ? 'Buy' : 'Sell'}
        </p>
        <p>
          <strong>Total Value:</strong> $
          {formData.quantity && formData.price 
            ? (parseFloat(formData.quantity) * parseFloat(formData.price)).toFixed(2)
            : '0.00'
          }
        </p>
      </div>
    </form>
  );
};

export default OrderForm; 