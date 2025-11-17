# SPL Token Creator - Backend

Express.js backend API server for the SPL Token Creator application. Handles secure IPFS uploads via Pinata.

This is the **backend API** designed to work with the separate `metafrontend` application.

## Features

- Upload token logos to IPFS
- Upload token metadata JSON to IPFS
- Secure API key management
- CORS support for frontend communication

## Prerequisites

- Node.js 18+
- Pinata API credentials

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in this directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Pinata credentials:

```
PINATA_API_KEY=your_api_key_here
PINATA_SECRET_KEY=your_secret_key_here
PORT=3001
```

## Development

```bash
npm run dev
```

Server will run on `http://localhost:3001`

## Production

```bash
npm run build
npm start
```

## API Endpoints

### POST /api/upload-image

Upload an image file to IPFS.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (File)

**Response:**
```json
{
  "uri": "https://gateway.pinata.cloud/ipfs/..."
}
```

### POST /api/upload-metadata

Upload metadata JSON to IPFS.

**Request:**
- Content-Type: `application/json`
- Body: JSON metadata object

**Response:**
```json
{
  "uri": "https://gateway.pinata.cloud/ipfs/..."
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Technology Stack

- **Framework**: Express.js
- **Language**: TypeScript
- **File Upload**: Multer
- **IPFS Provider**: Pinata
- **HTTP Client**: Axios

## Deployment

For detailed deployment instructions to Render, Railway, or other platforms, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Related Documentation

- **Deployment Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Frontend Setup**: See the `metafrontend` repository
- **Frontend Configuration**: See `metafrontend/BACKEND_CONFIGURATION.md` to configure backend URL in frontend

## Security

- ✅ Pinata API keys are kept secure on the server
- ✅ Never expose API keys to the frontend
- ✅ CORS enabled for frontend communication
- ✅ Environment variables for all secrets

## Support

- Issues: Open an issue on GitHub
- Questions: Check the documentation files above
