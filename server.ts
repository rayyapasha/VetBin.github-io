import express, { Request, Response, NextFunction } from 'express';
import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  initDatabase,
  getFullState,
  generateLiveSqlDump,
  authenticateUser,
  registerCampusUser,
  getSessionUser,
  logoutSession,
  createBin,
  updateBinById,
  deleteBinById,
  emptyBinById,
  createReport,
  updateReportStatusById,
  dispatchReportById,
  rejectFalseReportById,
  bulkDispatchReportsByIds,
  resolveReportById,
  createVoucher,
  updateVoucherById,
  deleteVoucherById,
  addUserPoints,
  redeemVoucherForUser,
  resetAllDatabase
} from './src/server/db';
import { AuthUser } from './src/types';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface AuthenticatedRequest extends Request {
  authUser?: AuthUser;
  authToken?: string;
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  if (typeof req.query.token === 'string' && req.query.token.trim()) {
    return req.query.token.trim();
  }
  return null;
}

function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (token) {
    const user = getSessionUser(token);
    if (user) {
      req.authUser = user;
      req.authToken = token;
    }
  }
  next();
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  const user = getSessionUser(token);
  if (!user || !token) {
    return res.status(401).json({ error: 'Autentikasi diperlukan. Silakan login terlebih dahulu.' });
  }
  req.authUser = user;
  req.authToken = token;
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  const user = getSessionUser(token);
  if (!user || !token) {
    return res.status(401).json({ error: 'Silakan login sebagai Admin terlebih dahulu.' });
  }
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak. Fitur ini khusus Admin Kampus.' });
  }
  req.authUser = user;
  req.authToken = token;
  next();
}

async function startServer() {
  initDatabase();

  const app = express();
  const httpServer = http.createServer(app);

  // Real-time WebSocket Server attached on /ws
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const wsClients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    wsClients.add(ws);
    // Send initial authoritative state on connect
    try {
      ws.send(
        JSON.stringify({
          type: 'STATE_SYNC',
          event: 'initial_connect',
          payload: getFullState()
        })
      );
    } catch (err) {
      console.error('WS initial send error:', err);
    }

    ws.on('close', () => {
      wsClients.delete(ws);
    });
    ws.on('error', () => {
      wsClients.delete(ws);
    });
  });

  function broadcastState(event: string, extra?: { userUpdated?: AuthUser }) {
    const payload = getFullState();
    const stateMessage = JSON.stringify({
      type: 'STATE_SYNC',
      event,
      payload,
      timestamp: new Date().toISOString()
    });
    const userMessage = extra?.userUpdated
      ? JSON.stringify({
          type: 'USER_UPDATED',
          user: extra.userUpdated
        })
      : null;

    for (const client of wsClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(stateMessage);
        if (userMessage) {
          client.send(userMessage);
        }
      }
    }
  }

  let port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const portArgIdx = process.argv.indexOf('--port');
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    const parsed = parseInt(process.argv[portArgIdx + 1], 10);
    if (!isNaN(parsed)) port = parsed;
  }

  app.use(express.json({ limit: '20mb' }));

  // ==================== AUTH ROUTES ====================

  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi.' });
    }
    const result = authenticateUser(username, password);
    if (!result) {
      return res.status(401).json({ error: 'Username atau password salah.' });
    }
    return res.json(result);
  });

  app.post('/api/auth/register', (req, res) => {
    const { username, password, fullName } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Username dan password wajib diisi.' });
    }
    const result = registerCampusUser(username, password, fullName);
    if ('error' in result) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(201).json(result);
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    return res.json({ user: req.authUser });
  });

  app.post('/api/auth/logout', optionalAuth, (req: AuthenticatedRequest, res) => {
    if (req.authToken) {
      logoutSession(req.authToken);
    }
    return res.json({ ok: true });
  });

  // ==================== STATE ROUTE ====================

  app.get('/api/state', (_req, res) => {
    return res.json(getFullState());
  });

  // ==================== BINS ROUTES ====================

  app.post('/api/bins', requireAdmin, (req, res) => {
    try {
      const bin = createBin(req.body);
      broadcastState('bin:created');
      return res.status(201).json({ bin, state: getFullState() });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Gagal menambah titik tong.' });
    }
  });

  app.patch('/api/bins/:id', requireAdmin, (req, res) => {
    const updated = updateBinById(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Titik tong tidak ditemukan.' });
    broadcastState('bin:updated');
    return res.json({ bin: updated, state: getFullState() });
  });

  app.delete('/api/bins/:id', requireAdmin, (req, res) => {
    const ok = deleteBinById(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Titik tong tidak ditemukan.' });
    broadcastState('bin:deleted');
    return res.json({ ok: true, state: getFullState() });
  });

  app.post('/api/bins/:id/empty', (req, res) => {
    const updated = emptyBinById(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Titik tong tidak ditemukan.' });
    broadcastState('bin:emptied');
    return res.json({ bin: updated, state: getFullState() });
  });

  // ==================== REPORTS ROUTES ====================

  app.post('/api/reports', optionalAuth, (req: AuthenticatedRequest, res) => {
    try {
      const { binId, issueType, photoUrl, notes, reporter } = req.body || {};
      if (!binId || !issueType) {
        return res.status(400).json({ error: 'Data titik tong dan jenis masalah wajib diisi.' });
      }
      const report = createReport({
        binId,
        issueType,
        photoUrl,
        notes,
        reporter,
        reportedByUsername: req.authUser?.username
      });
      broadcastState('report:created');
      return res.status(201).json({ report, state: getFullState() });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Gagal mengirim laporan.' });
    }
  });

  app.patch('/api/reports/:id/status', requireAdmin, (req, res) => {
    const { status } = req.body || {};
    const updated = updateReportStatusById(req.params.id, status);
    if (!updated) return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
    broadcastState('report:status_updated');
    return res.json({ report: updated, state: getFullState() });
  });

  app.post('/api/reports/:id/dispatch', requireAdmin, (req, res) => {
    const updated = dispatchReportById(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
    broadcastState('report:dispatched');
    return res.json({ report: updated, state: getFullState() });
  });

  app.post('/api/reports/:id/reject', requireAdmin, (req, res) => {
    const { reason } = req.body || {};
    const updated = rejectFalseReportById(req.params.id, reason);
    if (!updated) return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
    broadcastState('report:rejected');
    return res.json({ report: updated, state: getFullState() });
  });

  app.post('/api/reports/bulk-dispatch', requireAdmin, (req, res) => {
    const { ids } = req.body || {};
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: 'Daftar ID laporan tidak valid.' });
    }
    const count = bulkDispatchReportsByIds(ids);
    broadcastState('report:bulk_dispatched');
    return res.json({ count, state: getFullState() });
  });

  app.post('/api/reports/:id/resolve', (req, res) => {
    const updated = resolveReportById(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
    broadcastState('report:resolved');
    return res.json({ report: updated, state: getFullState() });
  });

  // ==================== VOUCHERS & POINTS ROUTES ====================

  app.post('/api/vouchers', requireAdmin, (req, res) => {
    try {
      const voucher = createVoucher(req.body);
      broadcastState('voucher:created');
      return res.status(201).json({ voucher, state: getFullState() });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Gagal menambah voucher.' });
    }
  });

  app.patch('/api/vouchers/:id', requireAdmin, (req, res) => {
    const updated = updateVoucherById(req.params.id, req.body || {});
    if (!updated) return res.status(404).json({ error: 'Voucher tidak ditemukan.' });
    broadcastState('voucher:updated');
    return res.json({ voucher: updated, state: getFullState() });
  });

  app.delete('/api/vouchers/:id', requireAdmin, (req, res) => {
    const ok = deleteVoucherById(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Voucher tidak ditemukan.' });
    broadcastState('voucher:deleted');
    return res.json({ ok: true, state: getFullState() });
  });

  app.post('/api/points/scan', requireAuth, (req: AuthenticatedRequest, res) => {
    const { amount, wasteType } = req.body || {};
    const pointsAmount = typeof amount === 'number' && amount > 0 ? amount : 50;
    const updatedUser = addUserPoints(req.authUser!.id, pointsAmount, wasteType);
    if (!updatedUser) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    broadcastState('points:added', { userUpdated: updatedUser });
    return res.json({ user: updatedUser });
  });

  app.post('/api/vouchers/:id/redeem', requireAuth, (req: AuthenticatedRequest, res) => {
    const result = redeemVoucherForUser(req.authUser!.id, req.params.id);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    broadcastState('voucher:redeemed', { userUpdated: result.user });
    return res.json({
      success: true,
      message: result.message,
      code: result.code,
      user: result.user,
      state: getFullState()
    });
  });

  // ==================== DATABASE EXPORT / RESET ====================

  app.get('/api/database/export-sql', requireAdmin, (_req, res) => {
    const sqlDump = generateLiveSqlDump();
    const filename = `vetbin_phpmyadmin_${new Date().toISOString().slice(0, 10)}.sql`;
    res.setHeader('Content-Type', 'application/sql; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(sqlDump);
  });

  app.post('/api/database/reset', requireAdmin, (_req, res) => {
    resetAllDatabase();
    broadcastState('database:reset');
    return res.json({ ok: true, state: getFullState() });
  });

  // ==================== AI WASTE RECOGNITION ROUTE ====================

  app.post('/api/analyze-waste', async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Image data is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: cleanBase64,
                },
              },
              {
                text: `Analisis foto objek sampah ini menggunakan teknik visual recognition mirip Google Lens / Google Image Cross-Check untuk sistem pemilahan kampus VetBin.
Kembalikan JSON murni tanpa markdown dengan format:
{
  "itemName": "Nama spesifik objek sampah dan merk/tipe jika teridentifikasi (contoh: Botol Air Mineral Plastik PET 600ml, Cup Minuman Kopi Seal Press, Kardus Kemasan Modul, Kulit Buah Pisang, Baterai Alkaline AA)",
  "category": "Anorganik" | "Organik" | "Kertas" | "E-waste / Baterai",
  "binColor": "Tong kuning" | "Tong hijau" | "Tong biru" | "Dropbox merah",
  "confidence": 98,
  "icon": "bottle" | "cup" | "package" | "utensils" | "file-text" | "battery-charging" | "leaf" | "cpu",
  "tips": "Instruksi praktis 1 kalimat (contoh: Kosongkan sisa air dan remas botol sebelum dibuang ke tong kuning).",
  "visualMatch": {
    "matchedObject": "Nama objek hasil pencocokan basis data gambar visual",
    "similarityScore": 97.5,
    "material": "Bahan spesifik (contoh: Plastik PET #1, Plastik PP Cup, Kertas Kraft Dupleks, Organik Basah, Sel Lithium/Mangan)",
    "features": [
      "Fitur visual 1 yang terdeteksi (bentuk/transparansi)",
      "Fitur visual 2 (warna/tekstur)",
      "Fitur visual 3 (tutup/label/kontur)"
    ],
    "searchReference": "kata kunci pencarian referensi gambar"
  }
}`
              }
            ]
          },
          config: {
            responseMimeType: 'application/json',
          }
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text);
          return res.json(parsed);
        }
      }

      return res.status(200).json({
        fallback: true,
        message: 'No Gemini API key configured, use local vision model'
      });
    } catch (err: any) {
      console.error('Error in /api/analyze-waste:', err);
      return res.status(200).json({ error: err.message, fallback: true });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
