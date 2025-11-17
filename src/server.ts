import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';
import dotenv from 'dotenv';
import FormData from 'form-data';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Multer configuration for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Upload image endpoint
app.post('/api/upload-image', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      return res.status(500).json({ error: 'Pinata API keys not configured' });
    }

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

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
    res.json({ uri: imageUri });
  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Upload metadata endpoint
app.post('/api/upload-metadata', async (req: Request, res: Response) => {
  try {
    const metadata = req.body;

    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      return res.status(500).json({ error: 'Pinata API keys not configured' });
    }

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      metadata,
      {
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: pinataApiKey,
          pinata_secret_api_key: pinataSecretKey,
        },
      }
    );

    const metadataUri = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
    res.json({ uri: metadataUri });
  } catch (error) {
    console.error('Error uploading metadata to Pinata:', error);
    res.status(500).json({ error: 'Failed to upload metadata' });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

app.listen(port, host, () => {
  console.log(`Backend server running on http://${host}:${port}`);
});
