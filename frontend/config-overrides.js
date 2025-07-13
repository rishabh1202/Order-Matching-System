const webpack = require('webpack');

module.exports = function override(config, env) {
  // Fix the allowedHosts issue
  if (env === 'development') {
    config.devServer = {
      ...config.devServer,
      allowedHosts: ['localhost', '.localhost', '127.0.0.1'],
      host: 'localhost',
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    };
  }
  
  return config;
}; 