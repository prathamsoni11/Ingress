# Simple Test Data Collection API

A lightweight Node.js API for collecting visitor data from frontend scripts.

## 🚀 Quick Start

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Setup environment**

   ```bash
   cp .env.example .env
   # Edit .env with your Firebase configuration
   ```

3. **Run the server**
   ```bash
   npm run dev  # Development
   npm start    # Production
   ```

## 📋 Environment Variables

Create a `.env` file with:

```env
PORT=3000
NODE_ENV=development
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=./src/config/your-service-account.json
```

## 🔗 API Endpoint

### POST /api/simple-test

Stores visitor data from frontend scripts.

**Request Body:**

```json
{
  "sessionId": "test-session-abc123",
  "ipAddress": "203.0.113.45",
  "pageUrl": ["https://example.com/home", "https://example.com/about"],
  "timezone": "2 minutes"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Data stored successfully",
  "id": "firebase-document-id"
}
```

## 📚 Documentation

Visit `/api-docs` when the server is running for interactive API documentation.

## 🏗️ Project Structure

```
src/
├── config/          # Firebase configuration
├── middleware/      # Express middleware
├── routes/          # API routes
├── utils/           # Utility functions
└── app.js           # Express app setup
```

## 📊 Health Check

GET `/health` - Returns server status and uptime.

## 👨‍💻 Author

**Pratham Soni**

- Email: prathamsoni11@gmail.com
