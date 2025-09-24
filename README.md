# 🚀 Ingress

**Enterprise IP Tracking & Lead Enrichment API**

A powerful Node.js application that transforms website visitor IP addresses into actionable business intelligence. Built with Express.js, JWT authentication, Firebase integration, and intelligent caching for enterprise-grade performance.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/express-%5E4.18.2-blue)](https://expressjs.com/)

## ✨ Features

- 🔐 **JWT Authentication** - Secure email/password login with 30-day tokens
- 👥 **User Management** - Admin controls with @consultadd.com domain restriction
- 🌐 **IP Intelligence** - Real-time IP tracking with business enrichment
- 🏢 **Company Profiles** - Detailed company data with executive contacts
- ⚡ **Smart Caching** - Intelligent performance optimization
- 📊 **Analytics Dashboard** - Business intelligence and visitor insights
- 🔥 **Firebase Integration** - Scalable Firestore database
- 📚 **API Documentation** - Complete Swagger/OpenAPI docs
- 🛡️ **Enterprise Security** - Role-based access control and data validation

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Install dependencies:

```bash
npm install
```

### Running the Application

#### Development Mode (with nodemon)

```bash
npm run dev
```

#### Production Mode

```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

All API endpoints require authentication via API key.

### Authentication

**JWT Token Authentication:**

- **Header**: `Authorization: Bearer <token>`
- **Get token**: Login with email/password at `/api/login`
- **Expires**: 30 days (configurable)
- **Roles**: Admin users can access all endpoints, regular users can track visitors

### Endpoints

- `GET /` - Welcome message and server status (public)
- `GET /api/health` - Health check endpoint (JWT token)
- `POST /api/login` - Login with email/password and get JWT token (public)
- `POST /api/users` - Create new user (admin only)
- `GET /api/users` - Get all users (admin only)
- `PATCH /api/users/{id}/status` - Update user status (admin only)
- `DELETE /api/users/{id}` - Delete user (admin only)
- `POST /api/track` - Track visitor data (JWT token)
- `GET /api/visitors` - Get all visitor data (JWT token, admin only)
- `GET /api/dashboard-summary` - Get analytics dashboard data (JWT token)
- `GET /api/enrichment-domains` - Get available enrichment domains for testing (JWT token)
- `GET /api/company/{domain}` - Get detailed company profile by domain (JWT token)
- `GET /api/cache/stats` - Get cache statistics (JWT token, admin only)
- `DELETE /api/cache/clear` - Clear all cache entries (JWT token, admin only)
- `GET /api-docs` - Swagger API documentation (public)

### Example Usage

#### JWT Authentication

```bash
# First login to get token
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@consultadd.com","password":"Admin@123456"}'

# Then use token for protected endpoints
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/health
```

## Quick Start with JWT

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm run dev

# 3. Test JWT authentication
npm run example:jwt
```

## Project Structure

```
ingress/
├── server.js                    # Server entry point
├── package.json                 # Project dependencies and scripts
├── test-jwt.js                 # JWT testing script
├── .gitignore                  # Git ignore rules
├── README.md                   # Project documentation
├── examples/
│   └── jwt-client-example.js   # JWT client example
└── src/
    ├── app.js                 # Express app setup
    ├── config/
    │   └── firebase.js        # Firebase configuration
    ├── data/
    │   └── ip-database.json   # Mock IP database
    ├── middleware/
    │   ├── index.js          # Basic middleware
    │   └── auth.js           # Authentication middleware (API Key + JWT)
    ├── routes/
    │   └── index.js          # API routes (login, health, track, visitors)
    └── services/
        └── ipEnrichmentService.js  # IP enrichment logic
```

## Default Admin Account

- **Email**: `admin@consultadd.com`
- **Password**: `Admin@123456`
- **Role**: `admin`

The admin can create new users with @consultadd.com email addresses through the API endpoints.

## Enhanced Dummy Data

The system includes comprehensive test data for realistic development:

### **IP Database** (15 entries):

- **Business IPs**: Microsoft, Google, GitHub, Bank of America, AT&T, Acme Corp, Global Solutions
- **ISP/Hosting**: Airtel, Cloudflare, Hetzner, Korea Telecom
- **Education**: University of Virginia
- **Government**: US Department of Health & Human Services

### **Company Enrichment** (10 companies):

- **Complete profiles** with logos, employee counts, revenue, contacts
- **Executive contacts** with names, roles, and email addresses
- **Technology stacks** and social media profiles
- **Realistic data** from Fortune 500 companies to startups

### **Test IPs for Different Scenarios:**

```bash
# Business (will be enriched)
204.79.197.200  # Microsoft Corporation
8.8.8.8         # Google LLC
140.82.112.4    # GitHub, Inc.

# ISP (will be filtered)
125.20.250.6    # BHARTI Airtel Ltd.
104.28.21.13    # Cloudflare, Inc.

# Education (will be enriched)
128.143.0.0     # University of Virginia

# Government (will be enriched)
23.210.14.0     # US GOVERNMENT-HHS
```

## Performance Optimization

### **Intelligent Caching System:**

- **IP Enrichment Cache** - 24 hours for successful lookups, 1 hour for filtered results
- **Company Data Cache** - 24 hours for found companies, 1 hour for not found
- **Automatic Cleanup** - Expired entries are automatically removed
- **Memory Efficient** - In-memory storage with configurable TTL

### **Cache Benefits:**

- **Faster Response Times** - Cached lookups return instantly
- **Reduced API Calls** - Simulated network delays only on cache misses
- **Better User Experience** - Consistent performance for repeated queries
- **Development Friendly** - Speeds up testing and development workflows

### **Cache Management:**

- **Statistics Endpoint** - Monitor cache performance and memory usage
- **Admin Controls** - Clear cache when needed for testing
- **Automatic Expiration** - Smart TTL based on data type and success status
