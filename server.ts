import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import Airtable from 'airtable';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed (jpeg, jpg, png, gif, webp)'));
  }
});

// API Routes
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

app.get('/api/images', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to list images' });
    }
    const images = files.map(file => ({
      name: file,
      url: `/uploads/${file}`
    }));
    res.json(images);
  });
});

// Airtable integration
let airtableBase: any = null;

const getAirtableBase = () => {
  if (!airtableBase) {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (!apiKey || !baseId) {
      throw new Error('Airtable configuration missing (AIRTABLE_API_KEY or AIRTABLE_BASE_ID)');
    }
    Airtable.configure({ apiKey });
    airtableBase = Airtable.base(baseId);
  }
  return airtableBase;
};

app.post('/api/survey', async (req, res) => {
  try {
    const formData = req.body ?? {};
    if (!formData.name?.trim() || !formData.email?.trim()) {
      return res.status(400).json({ error: 'Bad Request', details: 'Missing name or email' });
    }

    const base = getAirtableBase();
    const tableName =
      process.env.AIRTABLE_TABLE_ID ||
      process.env.AIRTABLE_TABLE_NAME ||
      'Survey Submissions';

    const record: Record<string, string | boolean> = {
      'Name': formData.name,
      'Email': formData.email,
      'Country': formData.country ?? '',
      'Over 18': formData.isOver18 === 'yes',
      'Active Creator': formData.isActiveCreator === 'yes',
      'Generating Revenue': formData.isGeneratingRevenue === 'yes',
      'Social Platform': formData.socialPlatform ?? '',
      'Social Handle': formData.socialHandle ?? '',
      'Content Type': formData.contentType ?? '',
      'Interested in Campaigns': Boolean(formData.interestedInCampaigns),
      'Agrees to Profit Share': Boolean(formData.agreesToProfitShare),
      'Submission Date': new Date().toISOString(),
    };

    if (formData.whatsapp?.trim()) {
      record['WhatsApp'] = formData.whatsapp.trim();
    }
    if (formData.goals?.trim()) {
      record['Goals'] = formData.goals.trim();
    }
    if (formData.isGeneratingRevenue === 'yes' && formData.monthlyEarnings) {
      record['Monthly Earnings'] = formData.monthlyEarnings;
    }

    await base(tableName).create([{ fields: record }]);
    res.json({ success: true });
  } catch (error) {
    console.error('Airtable Error:', error);
    res.status(500).json({
      error: 'Failed to submit to Airtable',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

import { seoPages } from './content/seoData.ts';

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      const url = req.path.replace(/^\/|\/$/g, '');
      const seoPage = seoPages.find(p => p.slug === url);
      
      const indexPath = path.join(distPath, 'index.html');
      let html = fs.readFileSync(indexPath, 'utf8');

      if (seoPage) {
        // Replace Title
        html = html.replace(
          /<title>.*?<\/title>/, 
          `<title>${seoPage.title}</title>`
        );
        // Replace Description
        html = html.replace(
          /<meta name="description" content=".*?" \/>/,
          `<meta name="description" content="${seoPage.description}" />`
        );
        // Replace Keywords
        html = html.replace(
          /<meta name="keywords" content=".*?" \/>/,
          `<meta name="keywords" content="${seoPage.keywords}" />`
        );
        // Replace OG Title
        html = html.replace(
          /<meta property="og:title" content=".*?" \/>/,
          `<meta property="og:title" content="${seoPage.title}" />`
        );
        // Replace OG Description
        html = html.replace(
          /<meta property="og:description" content=".*?" \/>/,
          `<meta property="og:description" content="${seoPage.description}" />`
        );
      }

      res.send(html);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
