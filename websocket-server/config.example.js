// WebSocket Server Configuration Example
// Copy this to config.js and update with your actual values

module.exports = {
  // Allowed origins for CORS (comma-separated)
  // Add your production domain here
  allowedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://habii-235d1.web.app',
    'https://habii-235d1.firebaseapp.com',
    'https://habii-web-app.vercel.app',
    'https://habii.life',
    // Add your custom domain here if you have one
    // 'https://yourdomain.com'
  ],

  // Server port
  port: process.env.PORT || 3001,

  // Node environment
  nodeEnv: process.env.NODE_ENV || 'development',
};
