import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';
import dotenv from 'dotenv';
import FormData from 'form-data';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] Incoming ${req.method} ${req.path} from ${req.ip}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] Completed ${req.method} ${req.path} - Status: ${res.statusCode} - Duration: ${duration}ms`);
  });
  
  next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Multer configuration for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Upload image endpoint
app.post('/api/upload-image', upload.single('file'), async (req: Request, res: Response) => {
  const requestId = Date.now();
  console.log(`[${requestId}] Processing image upload request`);
  
  try {
    if (!req.file) {
      console.log(`[${requestId}] Error: No file provided`);
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log(`[${requestId}] Received file: ${req.file.originalname}, Size: ${req.file.size} bytes, Type: ${req.file.mimetype}`);

    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_API_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      console.log(`[${requestId}] Error: Pinata API keys not configured`);
      return res.status(500).json({ error: 'Pinata API keys not configured' });
    }

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    console.log(`[${requestId}] Uploading to Pinata...`);
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          pinata_api_key: pinataApiKey,
          pinata_secret_api_key: pinataSecretKey,
        },
      }
    );

    const imageUri = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
    console.log(`[${requestId}] Successfully uploaded to Pinata: ${imageUri}`);
    res.json({ uri: imageUri });
  } catch (error) {
    console.error(`[${requestId}] Error uploading to Pinata:`, error);
    if (axios.isAxiosError(error)) {
      console.error(`[${requestId}] Axios error details:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    }
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Upload metadata endpoint
app.post('/api/upload-metadata', async (req: Request, res: Response) => {
  const requestId = Date.now();
  console.log(`[${requestId}] Processing metadata upload request`);
  
  try {
    const metadata = req.body;
    console.log(`[${requestId}] Metadata size: ${JSON.stringify(metadata).length} bytes`);

    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_API_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      console.log(`[${requestId}] Error: Pinata API keys not configured`);
      return res.status(500).json({ error: 'Pinata API keys not configured' });
    }

    console.log(`[${requestId}] Uploading metadata to Pinata...`);
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      {
        pinataContent: metadata,
        pinataMetadata: {
          name: 'metadata.json'
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: pinataApiKey,
          pinata_secret_api_key: pinataSecretKey,
        },
      }
    );

    const metadataUri = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
    console.log(`[${requestId}] Successfully uploaded metadata to Pinata: ${metadataUri}`);
    res.json({ uri: metadataUri });
  } catch (error) {
    console.error(`[${requestId}] Error uploading metadata to Pinata:`, error);
    if (axios.isAxiosError(error)) {
      console.error(`[${requestId}] Axios error details:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    }
    res.status(500).json({ error: 'Failed to upload metadata' });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  console.log('Health check request received');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

app.listen(port, host, () => {
  console.log(`Backend server running on http://${host}:${port}`);
});
