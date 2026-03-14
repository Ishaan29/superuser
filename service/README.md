# Proto Super User Service

A Node.js TypeScript Express service for the Proto Super User application.

## Features

- **TypeScript**: Full TypeScript support with strict type checking
- **Express.js**: Fast, unopinionated web framework
- **Security**: Helmet for security headers, CORS, rate limiting
- **Logging**: Custom request/response logging middleware
- **Error Handling**: Centralized error handling middleware
- **Environment Configuration**: dotenv support

## Quick Start

### Installation

```bash
cd service
npm install
```

### Development

```bash
npm run dev
```

This starts the server in development mode with hot reloading on `http://localhost:3002`.

### Build & Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## Scripts

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run clean` - Remove dist folder
- `npm run build:prod` - Clean and build for production
- `npm run type-check` - Check TypeScript types without compiling

## Environment Variables

Create a `.env` file in the service directory:

```env
# Server Configuration
PORT=3002
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# API Configuration
API_VERSION=v1

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Chat API
- `POST /api/chat` - Send a message to the AI
  ```json
  {
    "message": "Hello, how are you?"
  }
  ```

### Users (Example)
- `GET /api/users` - Get list of users

### Echo (Testing)
- `POST /api/echo` - Echo back the request data

## Project Structure

```
service/
├── src/
│   ├── middleware/
│   │   ├── errorHandler.ts
│   │   └── logger.ts
│   ├── routes/
│   │   └── api.ts
│   └── index.ts
├── dist/                 # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Development

The service includes:

- **CORS** configured for localhost development
- **Rate limiting** to prevent abuse
- **Security headers** via Helmet
- **Request logging** for debugging
- **Error handling** with appropriate HTTP status codes
- **TypeScript** with strict mode enabled

## Integration

This service is designed to work with the Electron app. The Electron main process can communicate with this service via HTTP requests to provide backend functionality. 