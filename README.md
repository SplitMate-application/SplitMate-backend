# SplitMate Backend

A secure, production-ready Node.js Express backend application with comprehensive security measures, validation, logging, and best practices.

## 🚀 Features

### Security Features

- **Helmet.js** - Security headers protection
- **CORS** - Cross-Origin Resource Sharing configuration
- **Rate Limiting** - API rate limiting and speed limiting
- **Input Validation** - Express-validator and Joi validation
- **XSS Protection** - Cross-site scripting prevention
- **NoSQL Injection Protection** - MongoDB query sanitization
- **Parameter Pollution Protection** - HTTP Parameter Pollution prevention
- **Content Security Policy** - CSP headers configuration
- **Request Sanitization** - Input sanitization middleware
- **Secure Cookie Handling** - Cookie parser with secret
- **Compression** - Response compression for performance

### Logging & Monitoring

- **Winston Logger** - Structured logging with multiple transports
- **Request Logging** - HTTP request/response logging
- **Security Event Logging** - Security incident tracking
- **Error Logging** - Comprehensive error handling and logging
- **Performance Monitoring** - Request duration tracking

### Validation & Error Handling

- **Express-validator** - Request validation
- **Joi Schemas** - Schema-based validation
- **Global Error Handler** - Centralized error management
- **Custom Error Responses** - Consistent error format
- **Validation Middleware** - Reusable validation patterns

### Development Features

- **Environment Configuration** - Flexible environment setup
- **Health Check Endpoints** - Application health monitoring
- **API Documentation** - Built-in API information
- **Graceful Shutdown** - Proper application termination
- **Uncaught Exception Handling** - Process error management

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB (for database)
- Redis (for rate limiting and sessions)

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd SplitMate-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp env.example .env
   ```

   Edit `.env` file with your configuration:

   ```env
   NODE_ENV=development
   PORT=5000
   COOKIE_SECRET=your-super-secret-cookie-key
   JWT_SECRET=your-super-secret-jwt-key
   MONGODB_URI=mongodb://localhost:27017/splitmate
   REDIS_URL=redis://localhost:6379
   ```

4. **Create logs directory**
   ```bash
   mkdir -p logs
   ```

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## 📡 API Endpoints

### Health & Status

- `GET /health` - Health check endpoint
- `GET /api/v1/status` - Detailed application status
- `GET /api/v1/ping` - Simple ping endpoint
- `GET /api/v1/test` - Test endpoint

### Authentication

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Token refresh
- `POST /api/v1/auth/forgot-password` - Password reset request
- `POST /api/v1/auth/reset-password` - Password reset

### User Management

- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `PUT /api/v1/users/change-password` - Change password
- `DELETE /api/v1/users/account` - Delete account
- `GET /api/v1/users/:userId` - Get public user profile
- `POST /api/v1/users/avatar` - Upload avatar
- `GET /api/v1/users/activity` - Get user activity

### API Information

- `GET /api/v1/info` - API information and documentation

## 🔒 Security Configuration

### Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Speed Limiting**: 50 requests before delay, 500ms delay per additional request

### CORS Configuration

- **Origins**: Configurable via `ALLOWED_ORIGINS` environment variable
- **Credentials**: Enabled
- **Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS

### Content Security Policy

```javascript
{
  defaultSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  scriptSrc: ["'self'"],
  imgSrc: ["'self'", "data:", "https:"],
  connectSrc: ["'self'"],
  fontSrc: ["'self'"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  frameSrc: ["'none'"]
}
```

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

## 📊 Logging

### Log Files

- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/requests.log` - HTTP request logs
- `logs/security.log` - Security event logs

### Log Levels

- `error` - Error messages
- `warn` - Warning messages
- `info` - Information messages
- `http` - HTTP request logs
- `debug` - Debug messages (development only)

## 🏗️ Project Structure

```
SplitMate-backend/
├── middleware/
│   ├── errorMiddleware.js      # Error handling middleware
│   └── validationMiddleware.js # Validation and sanitization
├── routes/
│   ├── index.js               # Main routes index
│   ├── authRoutes.js          # Authentication routes
│   ├── userRoutes.js          # User management routes
│   └── apiRoutes.js           # General API routes
├── utils/
│   └── logger.js              # Logging configuration
├── logs/                      # Log files directory
├── server.js                  # Main application file
├── package.json               # Dependencies and scripts
├── env.example                # Environment variables example
└── README.md                  # This file
```

## 🔧 Environment Variables

### Required Variables

- `NODE_ENV` - Application environment
- `PORT` - Server port
- `COOKIE_SECRET` - Cookie signing secret
- `JWT_SECRET` - JWT signing secret

### Optional Variables

- `ALLOWED_ORIGINS` - CORS allowed origins
- `MONGODB_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection string
- `LOG_LEVEL` - Logging level
- `RATE_LIMIT_MAX_REQUESTS` - Rate limiting configuration

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📝 API Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Optional message"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "details": ["Detailed error information"]
  }
}
```

## 🚨 Security Best Practices

1. **Environment Variables**: Never commit sensitive data to version control
2. **Secrets Management**: Use strong, unique secrets for cookies and JWT
3. **Rate Limiting**: Configure appropriate rate limits for your use case
4. **Input Validation**: Always validate and sanitize user input
5. **HTTPS**: Use HTTPS in production
6. **Regular Updates**: Keep dependencies updated
7. **Monitoring**: Monitor logs for security events
8. **Backup**: Regular database backups

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the logs for error details
- Review the security configuration

## 🔄 Updates

- Keep dependencies updated regularly
- Monitor security advisories
- Review and update security configurations
- Test thoroughly before deploying updates
