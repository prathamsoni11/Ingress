# Environment Configuration Guide

This application supports multiple environments with specific configurations for each.

## Available Environments

### 🔧 Development Environment

- **File**: `.env.development`
- **Purpose**: Local development and testing
- **Features**:
  - Swagger documentation enabled
  - Debug logging enabled
  - Permissive CORS settings
  - Lower timeouts for faster development

### 🏭 Production Environment

- **File**: `.env.production`
- **Purpose**: Live production deployment
- **Features**:
  - Swagger documentation disabled
  - Error-level logging only
  - Strict CORS settings
  - Higher timeouts for stability
  - Rate limiting enabled

## Environment Files

### `.env.example` (Template)

**Purpose**: Template and documentation for all environment variables

- ✅ **Safe to commit** - Contains no real secrets
- 📖 **Documentation** - Shows all required variables
- 🚀 **Quick setup** - Copy and customize for any environment
- 🔒 **Security** - Uses placeholder values only

### `.env.development`

```env
PORT=3000
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
SWAGGER_ENABLED=true
```

### `.env.production`

```env
PORT=8080
NODE_ENV=production
DEBUG=false
LOG_LEVEL=error
CORS_ORIGIN=https://yourdomain.com
SWAGGER_ENABLED=false
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Usage

### Development Mode

```bash
# Using npm scripts
npm run dev                    # Start with nodemon
npm run dev:watch             # Watch for file changes
npm run start:dev             # Start without nodemon

# Direct node command
NODE_ENV=development node server.js
```

### Production Mode

```bash
# Using npm scripts
npm start                     # Production start with startup script
npm run start:prod           # Direct production start

# Direct node command
NODE_ENV=production node server.js
```

## Quick Setup with .env.example

### Automated Setup (Recommended)

```bash
git clone <repository>
cd <project>
npm install
npm run setup:env          # Interactive environment setup wizard
npm run validate:env       # Validate all configurations
```

### Manual Setup

```bash
# Copy template for specific environment
cp .env.example .env.development
cp .env.example .env.production

# Edit files with your actual values
nano .env.development
nano .env.production
```

### What .env.example Contains

- 📋 **All required variables** with descriptions
- 🔒 **Safe placeholder values** (no real secrets)
- 📖 **Usage examples** for different environments
- ✅ **Safe to commit** to version control

## Environment Validation

### Test Environment Configuration

```bash
npm run test:env
```

### Validate All Environments

```bash
npm run validate:env
```

## Configuration Options

| Variable          | Development  | Production     | Description           |
| ----------------- | ------------ | -------------- | --------------------- |
| `PORT`            | 3000         | 8080           | Server port           |
| `DEBUG`           | true         | false          | Debug mode            |
| `LOG_LEVEL`       | debug        | error          | Logging level         |
| `CORS_ORIGIN`     | localhost:\* | yourdomain.com | Allowed origins       |
| `SWAGGER_ENABLED` | true         | false          | API documentation     |
| `DB_TIMEOUT`      | 5000         | 10000          | Database timeout (ms) |
| `REQUEST_TIMEOUT` | 30000        | 60000          | Request timeout (ms)  |

## Security Considerations

### Development

- ✅ Permissive CORS for testing
- ✅ Swagger documentation available
- ✅ Debug information exposed
- ⚠️ Not suitable for public access

### Production

- 🔒 Strict CORS policy
- 🔒 No debug information
- 🔒 Rate limiting enabled
- 🔒 Swagger documentation disabled
- ✅ Production-ready security

## Environment Variables Priority

1. **Environment-specific file** (`.env.development`, `.env.production`)
2. **Default file** (`.env`)
3. **System environment variables**

## Deployment

### Development Deployment

```bash
git clone <repository>
cd <project>
npm install
cp .env.example .env.development
# Edit .env.development with your settings
npm run dev
```

### Production Deployment

```bash
git clone <repository>
cd <project>
npm install --production
cp .env.example .env.production
# Edit .env.production with production settings
npm start
```

## Troubleshooting

### Environment Not Loading

```bash
# Check if environment file exists
ls -la .env.*

# Validate environment configuration
npm run test:env

# Check environment variables
node -e "console.log(process.env.NODE_ENV)"
```

### Configuration Errors

```bash
# Validate all environments
node scripts/validate-env.js

# Check specific environment
NODE_ENV=production node scripts/validate-env.js
```

## Best Practices

1. **Never commit sensitive production data**
2. **Use environment-specific files for different settings**
3. **Validate environment configuration before deployment**
4. **Keep development and production configurations in sync**
5. **Use strong secrets in production**
6. **Enable appropriate logging levels for each environment**
