# 🚀 Ingress

**Enterprise IP Tracking & Lead Enrichment API**

A powerful Node.js application that transforms website visitor IP addresses into actionable business intelligence. Built with Express.js, JWT authentication, Firebase integration, and intelligent caching for enterprise-grade performance.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/express-%5E4.18.2-blue)](https://expressjs.com/)

## ✨ Features

- 🔐 **JWT Authentication** - Secure email/password login with 30-day tokens
- 👥 **User Management** - Admin controls with @consultadd.com domain restriction
- 🌐 **IP Intelligence** - Real-time IP tracking with business enrichment
- 🏢 **Company Profiles** - Detailed company data with executive contacts
- ⚡ **Smart Caching** - Intelligent performance optimization with TTL
- 📊 **Analytics Dashboard** - Business intelligence and visitor insights
- 🔥 **Firebase Integration** - Scalable Firestore database
- 📚 **API Documentation** - Complete Swagger/OpenAPI docs
- 🛡️ **Enterprise Security** - Rate limiting, input validation, and comprehensive logging
- 🚦 **Health Monitoring** - Built-in health checks and graceful shutdown

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Firebase project with Firestore enabled
- Firebase service account key

### Installation

1. **Clone and install**

   ```bash
   git clone https://github.com/prathamsoni11/Ingress.git
   cd Ingress
   npm install
   ```

2. **Configure environment (REQUIRED)**

   ```bash
   cp .env.example .env
   # Edit .env with your Firebase and admin credentials
   # ⚠️  ALL variables are required - no defaults provided
   # Server will not start if any variable is missing or invalid
   ```

3. **Add Firebase service account**

   - Download your Firebase service account JSON file
   - Place it in `src/config/` directory
   - Update `FIREBASE_SERVICE_ACCOUNT_PATH` in `.env`

4. **Start the server**

   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

5. **Access the API**
   - 🌐 Server: http://localhost:3000
   - 📚 Documentation: http://localhost:3000/api-docs
   - ❤️ Health Check: http://localhost:3000/health

## 📁 Project Structure

```
Ingress/
├── src/
│   ├── config/
│   │   ├── firebase.js              # Firebase configuration
│   │   └── *.json                   # Service account keys (gitignored)
│   ├── data/
│   │   ├── ip-database.json         # IP lookup database
│   │   └── company-enrichment.json  # Company profiles database
│   ├── middleware/
│   │   ├── auth.js                  # JWT authentication & rate limiting
│   │   └── index.js                 # Request logging & error handling
│   ├── routes/
│   │   └── index.js                 # API routes and endpoints
│   ├── services/
│   │   ├── userService.js           # User management with security
│   │   ├── ipEnrichmentService.js   # IP lookup and enrichment
│   │   ├── companyEnrichmentService.js # Company data enrichment
│   │   └── cacheService.js          # Intelligent caching system
│   ├── utils/
│   │   ├── constants.js             # Application constants
│   │   ├── validators.js            # Input validation utilities
│   │   └── logger.js                # Centralized logging system
│   └── app.js                       # Express application setup
├── server.js                        # Server entry point with graceful shutdown
├── package.json                     # Dependencies and scripts
├── .env.example                     # Environment variables template
└── README.md                        # This file
```

## 🔧 Environment Variables

⚠️ **All environment variables are REQUIRED** - No fallback defaults provided for security and explicit configuration.

| Variable                        | Description                  | Validation                             |
| ------------------------------- | ---------------------------- | -------------------------------------- |
| `PORT`                          | Server port                  | Must be 1-65535                        |
| `NODE_ENV`                      | Environment mode             | `development`, `production`, or `test` |
| `API_VERSION`                   | API version                  | Required string                        |
| `API_TITLE`                     | API title                    | Required string                        |
| `API_DESCRIPTION`               | API description              | Required string                        |
| `JWT_SECRET`                    | JWT signing secret           | **Minimum 32 characters**              |
| `FIREBASE_PROJECT_ID`           | Firebase project ID          | Required string                        |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to service account JSON | Required file path                     |
| `ADMIN_EMAIL`                   | Default admin email          | Valid email format                     |
| `ADMIN_PASSWORD`                | Default admin password       | **Minimum 8 characters**               |
| `ALLOWED_EMAIL_DOMAIN`          | Allowed email domain         | Required domain                        |
| `CORS_ORIGIN`                   | CORS allowed origins         | Required (use `*` for all)             |

### Environment Validation

The server performs strict validation on startup:

- ✅ Checks all required variables are present
- ✅ Validates data types and formats
- ✅ Ensures security requirements (password length, JWT secret strength)
- ❌ **Exits with error** if any validation fails

```bash
# Example validation error
❌ Missing required environment variables:
   - JWT_SECRET
   - FIREBASE_PROJECT_ID

💡 Please check your .env file and ensure all variables are set.
```

## 🔌 API Usage

### Authentication

Get a JWT token by logging in:

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@consultadd.com",
    "password": "Admin@123456"
  }'
```

### Track Visitors

Use the JWT token to track website visitors:

```bash
curl -X POST http://localhost:3000/api/track \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "ipAddress": "204.79.197.200",
    "sessionId": "abc123",
    "pageUrl": "https://example.com/landing"
  }'
```

### Get Company Profiles

Retrieve detailed company information:

```bash
curl -X GET http://localhost:3000/api/company/microsoft.com \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📋 API Endpoints

### 🔐 Authentication

- `POST /api/login` - Login and get JWT token

### 📊 Tracking

- `POST /api/track` - Track website visitor
- `GET /api/visitors` - Get all visitors (Admin only)
- `GET /api/dashboard-summary` - Get analytics summary

### 🏢 Company Intelligence

- `GET /api/company/{domain}` - Get company profile
- `GET /api/enrichment-domains` - List available domains

### 👥 User Management (Admin only)

- `POST /api/users` - Create new user
- `GET /api/users` - List all users
- `PATCH /api/users/{id}/status` - Update user status
- `DELETE /api/users/{id}` - Delete user

### 🔧 System

- `GET /health` - Health check (no auth required)
- `GET /api/health` - Authenticated health check
- `GET /api/cache/stats` - Cache statistics (Admin only)
- `DELETE /api/cache/clear` - Clear cache (Admin only)

## 🛡️ Security Features

### Authentication & Authorization

- JWT-based authentication with configurable expiration
- Email domain restrictions (@consultadd.com)
- Role-based access control (Admin/User)
- Account lockout after failed login attempts

### Input Validation

- Comprehensive input validation for all endpoints
- IP address format validation
- Email format and domain validation
- Password strength requirements

### Rate Limiting & Monitoring

- Built-in rate limiting (100 requests per 15 minutes)
- Per-IP tracking and enforcement
- Centralized logging with different levels
- Request/response logging with timing
- Security event logging

## ⚡ Performance Features

### Intelligent Caching

- In-memory caching with TTL (24-hour default)
- Automatic cleanup of expired entries
- Cache statistics and monitoring
- Configurable limits (10,000 entries max)

### Database Optimization

- Efficient Firestore queries
- Connection pooling and reuse
- Batch operations where applicable

## 🚀 Development

### Code Quality

- Centralized constants and configuration
- Comprehensive error handling
- Input validation utilities
- Graceful shutdown handling
- Structured logging with metadata

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run lint` - Code linting (placeholder)
- `npm run clean` - Clean cache and logs (placeholder)

### Testing

Interactive API testing available at `/api-docs` with Swagger UI.

## 📦 Deployment

### Production Checklist

- ✅ Set `NODE_ENV=production`
- ✅ Use strong JWT secrets (32+ characters)
- ✅ Configure proper CORS origins
- ✅ Set up logging aggregation
- ✅ Monitor health endpoints
- ✅ Secure Firebase service account permissions

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Support

For support and questions:

- 📧 Email: prathamsoni11@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/prathamsoni11/Ingress/issues)

---

**Built with ❤️ by [Pratham Soni](https://github.com/prathamsoni11)**
