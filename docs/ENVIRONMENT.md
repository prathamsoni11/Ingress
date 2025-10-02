# Environment Configuration

## 🚀 Quick Setup

```bash
git clone <repository>
cd <project>
npm install

# Copy the environment you need
cp .env.development .env    # For development
# OR
cp .env.production .env     # For production

# Edit .env with your actual values
nano .env

# Start the application
npm run dev                 # Development
npm start                   # Production
```

## 📁 Environment Files

### `.env.development` - Development Configuration

```env
PORT=3000
NODE_ENV=development
DEBUG=true
SWAGGER_ENABLED=true
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000
```

### `.env.production` - Production Configuration

```env
PORT=8080
NODE_ENV=production
DEBUG=false
SWAGGER_ENABLED=false
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔥 What to Change

After copying, update these placeholder values in your `.env`:

```env
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=./src/config/your-firebase-adminsdk.json
JWT_SECRET=your_super_secure_jwt_secret_key
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=Admin@123456
CORS_ORIGIN=https://yourdomain.com  # For production
```

## ✅ Validation

Environment validation happens **automatically** when you start the application. If any required variables are missing, the app will show an error and exit.

```bash
npm run dev     # Will validate environment automatically
npm start       # Will validate environment automatically
```

That's it! Simple manual copy approach. 🎉
