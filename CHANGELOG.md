# Changelog

All notable changes to the Ingress project will be documented in this file.

## [1.0.0] - 2024-01-15

### Added

- **JWT Authentication System** - Email/password login with 30-day token expiration
- **User Management** - Admin can create/manage users with @consultadd.com domain restriction
- **IP Tracking & Enrichment** - Real-time IP lookup with business intelligence
- **Company Intelligence** - Detailed company profiles with executive contacts
- **Caching System** - Intelligent in-memory caching for performance optimization
- **Firebase Integration** - Firestore database for user and visitor data storage
- **Swagger Documentation** - Complete API documentation at `/api-docs`
- **Dashboard Analytics** - Summary endpoint for business intelligence dashboards
- **CORS Support** - Cross-origin resource sharing configuration
- **Environment Configuration** - Secure environment variable management

### Features

- **15 Test IP Addresses** - Comprehensive test data for different scenarios
- **10 Company Profiles** - Rich company data including Fortune 500 companies
- **Role-Based Access Control** - Admin vs regular user permissions
- **Automatic Data Filtering** - ISP/hosting traffic filtering
- **Cache Management** - Admin endpoints for cache statistics and clearing
- **Error Handling** - Comprehensive error responses and logging
- **Security** - bcrypt password hashing and JWT token validation

### API Endpoints

- `POST /api/login` - User authentication
- `POST /api/track` - IP tracking and enrichment
- `GET /api/visitors` - Visitor data retrieval (admin)
- `GET /api/dashboard-summary` - Analytics dashboard data
- `GET /api/company/{domain}` - Company profile lookup
- `POST /api/users` - User creation (admin)
- `GET /api/users` - User management (admin)
- `GET /api/cache/stats` - Cache statistics (admin)
- `DELETE /api/cache/clear` - Cache management (admin)

### Technical Stack

- **Backend**: Node.js, Express.js
- **Authentication**: JWT with bcryptjs
- **Database**: Firebase Firestore
- **Documentation**: Swagger/OpenAPI 3.0
- **Caching**: In-memory with TTL
- **Security**: CORS, environment variables, input validation

### Default Admin Account

- **Email**: admin@consultadd.com
- **Password**: Admin@123456
- **Role**: admin

### Performance

- **Caching**: 24-hour cache for successful lookups, 1-hour for filtered results
- **Response Times**: Sub-100ms for cached requests
- **Memory Management**: Automatic cleanup of expired cache entries
