import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

const PriceChart = ({ completedOrders }) => {
  const chartData = useMemo(() => {
    if (!completedOrders || completedOrders.length === 0) {
      return [];
    }

    // Sort orders by completion time and take last 50 for chart
    const sortedOrders = [...completedOrders]
      .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
      .slice(-50);

    return sortedOrders.map((order, index) => ({
      time: new Date(order.completedAt).toLocaleTimeString(),
      price: parseFloat(order.price),
      quantity: order.quantity,
      value: parseFloat(order.price) * order.quantity,
      index: index + 1
    }));
  }, [completedOrders]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`Time: ${label}`}</p>
          <p className="tooltip-value">{`Price: $${data.price.toFixed(2)}`}</p>
          <p className="tooltip-value">{`Quantity: ${data.quantity.toLocaleString()}`}</p>
          <p className="tooltip-value">{`Value: $${data.value.toFixed(2)}`}</p>
        </div>
      );
    }
    return null;
  };

  if (completedOrders.length === 0) {
    return (
      <div className="chart-container">
        <div className="empty-chart">
          <p>📈 No completed orders to display</p>
          <p>Complete some trades to see the price chart</p>
        </div>
      </div>
    );
  }

  const minPrice = Math.min(...chartData.map(d => d.price));
  const maxPrice = Math.max(...chartData.map(d => d.price));
  const priceRange = maxPrice - minPrice;
  const yDomain = [
    Math.max(0, minPrice - priceRange * 0.1),
    maxPrice + priceRange * 0.1
  ];

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>Price Movement</h3>
        <div className="chart-stats">
          <span className="stat">
            Latest: ${chartData[chartData.length - 1]?.price.toFixed(2) || '0.00'}
          </span>
          <span className="stat">
            High: ${maxPrice.toFixed(2)}
          </span>
          <span className="stat">
            Low: ${minPrice.toFixed(2)}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="time" 
            stroke="#666"
            fontSize={12}
            tick={{ fontSize: 10 }}
          />
          <YAxis 
            domain={yDomain}
            stroke="#666"
            fontSize={12}
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#667eea"
            strokeWidth={2}
            fill="url(#priceGradient)"
            fillOpacity={0.3}
          />
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#667eea" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>

      <div className="chart-footer">
        <div className="volume-info">
          <span>Total Volume: {chartData.reduce((sum, d) => sum + d.quantity, 0).toLocaleString()}</span>
          <span>Total Value: ${chartData.reduce((sum, d) => sum + d.value, 0).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default PriceChart; 