import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { defaultInvitationData } from './src/data/initialData';
import { InvitationData, RsvpResponse } from './src/types/invitation';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'wedding_database.json');

// Interface for persisted database
interface DatabaseSchema {
  admin: {
    isConfigured: boolean;
    username: string;
    salt: string;
    passwordHash: string;
    updatedAt: string;
  };
  published: InvitationData;
  draft: InvitationData;
  rsvps: RsvpResponse[];
  sessions: { [token: string]: { username: string; expiresAt: number } };
}

// Password hashing utility using crypto.scryptSync
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// Generate new secure salt
function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Initialize and manage database
class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure structure matches
        if (!this.data.published) this.data.published = { ...defaultInvitationData };
        if (!this.data.draft) this.data.draft = { ...this.data.published };
        if (!this.data.rsvps) this.data.rsvps = [];
        if (!this.data.sessions) this.data.sessions = {};
        if (!this.data.admin) {
          this.data.admin = {
            isConfigured: false,
            username: '',
            salt: '',
            passwordHash: '',
            updatedAt: new Date().toISOString()
          };
        }
      } catch (err) {
        console.error('Failed to parse database, re-initializing with defaults', err);
        this.data = this.createInitialData();
        this.save();
      }
    } else {
      this.data = this.createInitialData();
      this.save();
    }
  }

  private createInitialData(): DatabaseSchema {
    return {
      admin: {
        isConfigured: false,
        username: '',
        salt: '',
        passwordHash: '',
        updatedAt: new Date().toISOString()
      },
      published: { ...defaultInvitationData },
      draft: { ...defaultInvitationData },
      rsvps: [
        {
          id: 'rsvp-demo-1',
          guestName: 'سلطان القحطاني',
          status: 'attending',
          companionCount: 2,
          message: 'ألف ألف مبروك للعروسين، بارك الله لكما وبارك عليكما وجمع بينكما في خير.',
          phone: '+966500000000',
          isVisibleInChat: true,
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
        },
        {
          id: 'rsvp-demo-2',
          guestName: 'د. خالد المنصور',
          status: 'attending',
          companionCount: 1,
          message: 'تهانينا القلبية للعروسين، نسأل الله لكما حياة عامرة بالمودة والسكينة.',
          phone: '+966511111111',
          isVisibleInChat: true,
          createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
        },
        {
          id: 'rsvp-demo-3',
          guestName: 'فيصل العتيبي',
          status: 'attending',
          companionCount: 0,
          message: 'بارك الله لكما، وجعل دياركم عامرة بالأفراح والمسرات الدائمة.',
          phone: '+966522222222',
          isVisibleInChat: true,
          createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
        }
      ],
      sessions: {}
    };
  }

  public save(): void {
    const tmp = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), 'utf-8');
    fs.renameSync(tmp, DB_FILE);
  }

  public isConfigured(): boolean {
    return this.data.admin.isConfigured === true && !!this.data.admin.username && !!this.data.admin.passwordHash;
  }

  public setupAdmin(username: string, passwordAttempt: string): void {
    const salt = generateSalt();
    const hash = hashPassword(passwordAttempt, salt);
    this.data.admin = {
      isConfigured: true,
      username: username.trim(),
      salt,
      passwordHash: hash,
      updatedAt: new Date().toISOString()
    };
    this.save();
  }

  public getPublished(): InvitationData {
    return this.data.published;
  }

  public getDraft(): InvitationData {
    return this.data.draft;
  }

  public updateDraft(draft: InvitationData): void {
    this.data.draft = draft;
    this.save();
  }

  public publishDraft(): InvitationData {
    this.data.published = { ...this.data.draft };
    this.save();
    return this.data.published;
  }

  public discardDraft(): InvitationData {
    this.data.draft = { ...this.data.published };
    this.save();
    return this.data.draft;
  }

  public verifyAdmin(username: string, passwordAttempt: string): boolean {
    if (!this.isConfigured()) return false;
    if (this.data.admin.username !== username.trim()) {
      return false;
    }
    const attemptHash = hashPassword(passwordAttempt, this.data.admin.salt);
    const validHashBuf = Buffer.from(this.data.admin.passwordHash, 'hex');
    const attemptHashBuf = Buffer.from(attemptHash, 'hex');
    if (validHashBuf.length !== attemptHashBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(validHashBuf, attemptHashBuf);
  }

  public createSession(username: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    // Session valid for 7 days
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    this.data.sessions[token] = { username, expiresAt };
    this.cleanExpiredSessions();
    this.save();
    return token;
  }

  public validateSession(token: string): boolean {
    if (!token) return false;
    const session = this.data.sessions[token];
    if (!session) return false;
    if (Date.now() > session.expiresAt) {
      delete this.data.sessions[token];
      this.save();
      return false;
    }
    return true;
  }

  public invalidateSession(token: string): void {
    if (this.data.sessions[token]) {
      delete this.data.sessions[token];
      this.save();
    }
  }

  public changeAdminCredentials(newUsername: string, newPassword?: string): void {
    if (newUsername) {
      this.data.admin.username = newUsername.trim();
    }
    if (newPassword && newPassword.length >= 6) {
      const salt = generateSalt();
      this.data.admin.salt = salt;
      this.data.admin.passwordHash = hashPassword(newPassword, salt);
    }
    this.data.admin.isConfigured = true;
    this.data.admin.updatedAt = new Date().toISOString();
    this.save();
  }

  public getAdminInfo() {
    return {
      username: this.data.admin.username,
      updatedAt: this.data.admin.updatedAt
    };
  }

  public getRsvps(): RsvpResponse[] {
    return this.data.rsvps;
  }

  public addRsvp(rsvp: Omit<RsvpResponse, 'id' | 'createdAt'>): RsvpResponse {
    const newEntry: RsvpResponse = {
      ...rsvp,
      id: `rsvp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      isVisibleInChat: true,
      createdAt: new Date().toISOString()
    };
    this.data.rsvps.unshift(newEntry);
    this.save();
    return newEntry;
  }

  public toggleRsvpVisibility(id: string): boolean {
    const item = this.data.rsvps.find(r => r.id === id);
    if (!item) return false;
    item.isVisibleInChat = item.isVisibleInChat === false ? true : false;
    this.save();
    return true;
  }

  public deleteRsvp(id: string): boolean {
    const initialLen = this.data.rsvps.length;
    this.data.rsvps = this.data.rsvps.filter(r => r.id !== id);
    if (this.data.rsvps.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public exportFullBackup(): DatabaseSchema {
    const copy = JSON.parse(JSON.stringify(this.data));
    delete copy.sessions;
    return copy;
  }

  public restoreBackup(payload: any): boolean {
    if (!payload || !payload.published || !payload.admin) {
      return false;
    }
    this.data.published = payload.published;
    this.data.draft = payload.draft || payload.published;
    this.data.rsvps = Array.isArray(payload.rsvps) ? payload.rsvps : [];
    if (payload.admin?.username && payload.admin?.passwordHash && payload.admin?.salt) {
      this.data.admin = payload.admin;
    }
    this.save();
    return true;
  }

  private cleanExpiredSessions() {
    const now = Date.now();
    for (const [tok, sess] of Object.entries(this.data.sessions)) {
      if (now > sess.expiresAt) {
        delete this.data.sessions[tok];
      }
    }
  }
}

const db = new DatabaseManager();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // Helper auth middleware
  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'غير مصرح: يجب تسجيل الدخول كمسؤول للقيام بهذه العملية' });
      return;
    }
    const token = authHeader.split(' ')[1];
    if (!db.validateSession(token)) {
      res.status(401).json({ error: 'انتهت صلاحية الجلسة، يرجى إعادة تسجيل الدخول' });
      return;
    }
    next();
  };

  // --- Auth Endpoints ---

  // Check whether administrator account is initialized
  app.get('/api/auth/setup-status', (_req: Request, res: Response) => {
    res.json({
      isConfigured: db.isConfigured()
    });
  });

  // First-time administrator creation
  app.post('/api/auth/setup', (req: Request, res: Response) => {
    if (db.isConfigured()) {
      res.status(400).json({ error: 'تم إعداد حساب المسؤول مسبقاً، يرجى تسجيل الدخول' });
      return;
    }

    const { username, password } = req.body;
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      res.status(400).json({ error: 'يجب أن لا يقل اسم المستخدم عن 3 أحرف' });
      return;
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'يجب أن لا تقل كلمة المرور عن 6 أحرف أو أرقام' });
      return;
    }

    db.setupAdmin(username.trim(), password);
    const token = db.createSession(username.trim());

    res.json({
      success: true,
      token,
      admin: db.getAdminInfo(),
      message: 'تم إنشاء بيانات المسؤول بنجاح والدخول إلى لوحة التحكم'
    });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    if (!db.isConfigured()) {
      res.status(400).json({ needsSetup: true, error: 'الموقع يحتاج إلى إعداد حساب المسؤول لأول مرة' });
      return;
    }

    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' });
      return;
    }

    if (!db.verifyAdmin(username, password)) {
      res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
      return;
    }

    const token = db.createSession(username.trim());
    res.json({
      success: true,
      token,
      admin: db.getAdminInfo(),
      message: 'تم تسجيل الدخول بنجاح'
    });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.json({ authenticated: false, isConfigured: db.isConfigured() });
      return;
    }
    const token = authHeader.split(' ')[1];
    const isValid = db.validateSession(token);
    if (isValid) {
      res.json({ authenticated: true, admin: db.getAdminInfo(), isConfigured: db.isConfigured() });
    } else {
      res.json({ authenticated: false, isConfigured: db.isConfigured() });
    }
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      db.invalidateSession(token);
    }
    res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
  });

  app.post('/api/auth/change-credentials', requireAdmin, (req: Request, res: Response) => {
    const { currentPassword, newUsername, newPassword } = req.body;
    const currentAdmin = db.getAdminInfo();

    if (!db.verifyAdmin(currentAdmin.username, currentPassword)) {
      res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      res.status(400).json({ error: 'يجب أن لا تقل كلمة المرور الجديدة عن 6 أحرف أو أرقام' });
      return;
    }

    db.changeAdminCredentials(newUsername, newPassword);
    res.json({ success: true, message: 'تم تحديث بيانات المسؤول بنجاح' });
  });

  // --- Public Invitation Endpoints ---

  app.get('/api/invitation', (req: Request, res: Response) => {
    const isPreview = req.query.preview === 'true';
    if (isPreview) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (db.validateSession(token)) {
          res.json({ data: db.getDraft(), isDraft: true });
          return;
        }
      }
    }
    res.json({ data: db.getPublished(), isDraft: false });
  });

  // --- Public Guest Wishes / Chat Messages Endpoint ---
  // Returns only verified public messages without phone numbers or private data
  app.get('/api/guest-messages', (_req: Request, res: Response) => {
    const messages = db.getRsvps()
      .filter(r => r.isVisibleInChat !== false && r.message && r.message.trim().length > 0)
      .map(r => ({
        id: r.id,
        guestName: r.guestName,
        message: r.message.trim(),
        createdAt: r.createdAt
      }));

    res.json({ messages });
  });

  // --- Admin Invitation Endpoints ---

  app.get('/api/invitation/draft', requireAdmin, (_req: Request, res: Response) => {
    res.json({
      draft: db.getDraft(),
      published: db.getPublished()
    });
  });

  app.post('/api/invitation/save-draft', requireAdmin, (req: Request, res: Response) => {
    const draft = req.body.draft;
    if (!draft || typeof draft !== 'object') {
      res.status(400).json({ error: 'البيانات غير صالحة' });
      return;
    }
    db.updateDraft(draft);
    res.json({
      success: true,
      message: 'تم حفظ المسودة في قاعدة البيانات بنجاح',
      draft: db.getDraft()
    });
  });

  app.post('/api/invitation/publish', requireAdmin, (_req: Request, res: Response) => {
    const published = db.publishDraft();
    res.json({
      success: true,
      message: 'تم نشر التعديلات بنجاح. أصبحت متاحة الآن لجميع الزوار!',
      published
    });
  });

  app.post('/api/invitation/discard', requireAdmin, (_req: Request, res: Response) => {
    const restored = db.discardDraft();
    res.json({
      success: true,
      message: 'تم التراجع عن التعديلات واستعادة النسخة المنشورة',
      draft: restored
    });
  });

  // --- Media URL Validator ---
  app.post('/api/media/validate', async (req: Request, res: Response) => {
    const { url, type } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ valid: false, message: 'الرابط غير صالح أو فارغ' });
      return;
    }

    if (url.startsWith('/src/assets/') || url.startsWith('/assets/')) {
      res.json({ valid: true, message: 'ملف محلي تم التحقق منه بنجاح' });
      return;
    }

    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        res.status(400).json({ valid: false, message: 'يجب أن يبدأ الرابط بـ https://' });
        return;
      }

      if (parsed.hostname.includes('drive.google.com') && !url.includes('uc?id=')) {
        res.status(400).json({
          valid: false,
          message: 'روابط Google Drive العادية ليست روابط مباشرة، يرجى استخدام رابط مباشر للملف'
        });
        return;
      }

      if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
        res.status(400).json({
          valid: false,
          message: 'روابط صفحات YouTube ليست ملفات MP4 مباشرة. يرجى تزويد رابط مباشر لملف الفيديو ينتهي بـ .mp4'
        });
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const resp = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      clearTimeout(timeoutId);

      const contentType = resp.headers.get('content-type') || '';
      const status = resp.status;

      if (status >= 200 && status < 400) {
        res.json({
          valid: true,
          status,
          contentType,
          message: 'الرابط متاح ويعمل بصورة ممتازة'
        });
      } else {
        res.status(400).json({
          valid: false,
          status,
          message: `تعذر الوصول إلى الملف، كود الاستجابة: ${status}`
        });
      }
    } catch (err: any) {
      res.status(400).json({
        valid: false,
        message: 'تعذر التحقق من الرابط. قد يكون السيرفر يمنع الفحص الخارجي أو الرابط غير متاح للعامة.'
      });
    }
  });

  // --- RSVP Endpoints ---

  app.post('/api/rsvp', (req: Request, res: Response) => {
    const { guestName, status, companionCount, message, phone } = req.body;
    if (!guestName || typeof guestName !== 'string' || !guestName.trim()) {
      res.status(400).json({ error: 'اسم الضيف الكريم مطلوب' });
      return;
    }
    if (!status || !['attending', 'apologizing'].includes(status)) {
      res.status(400).json({ error: 'يرجى تحديد حالة الحضور' });
      return;
    }

    const saved = db.addRsvp({
      guestName: guestName.trim(),
      status,
      companionCount: Number(companionCount) || 0,
      message: (message || '').trim(),
      phone: (phone || '').trim()
    });

    res.json({
      success: true,
      message: status === 'attending' 
        ? 'تم تأكيد حضوركم بنجاح، نتطلع بشوق لرؤيتكم ومشاركتنا فرحتنا!'
        : 'تم استلام اعتذاركم ببالغ التقدير، نشكركم على مشاعركم الطيبة.',
      id: saved.id
    });
  });

  app.get('/api/rsvp', requireAdmin, (_req: Request, res: Response) => {
    const rsvps = db.getRsvps();
    const attendingCount = rsvps
      .filter(r => r.status === 'attending')
      .reduce((sum, r) => sum + 1 + (r.companionCount || 0), 0);
    const apologizingCount = rsvps.filter(r => r.status === 'apologizing').length;

    res.json({
      rsvps,
      totalResponses: rsvps.length,
      attendingTotalPersons: attendingCount,
      attendingResponses: rsvps.filter(r => r.status === 'attending').length,
      apologizingCount
    });
  });

  app.post('/api/rsvp/:id/toggle-visibility', requireAdmin, (req: Request, res: Response) => {
    const ok = db.toggleRsvpVisibility(req.params.id);
    if (ok) {
      res.json({ success: true, message: 'تم تحديث ظهور الرسالة في شات الموقع' });
    } else {
      res.status(404).json({ error: 'الرد غير موجود' });
    }
  });

  app.delete('/api/rsvp/:id', requireAdmin, (req: Request, res: Response) => {
    const deleted = db.deleteRsvp(req.params.id);
    if (deleted) {
      res.json({ success: true, message: 'تم حذف الرد بنجاح' });
    } else {
      res.status(404).json({ error: 'الرد غير موجود' });
    }
  });

  app.get('/api/rsvp/export-csv', requireAdmin, (_req: Request, res: Response) => {
    const rsvps = db.getRsvps();
    const rows = [
      ['اسم الضيف', 'حالة الحضور', 'عدد المرافقين', 'إجمالي الأفراد', 'رقم الهاتف', 'الرسالة', 'ظاهر بالشات', 'تاريخ التسجيل']
    ];

    for (const r of rsvps) {
      const statusArabic = r.status === 'attending' ? 'حاضر بإذن الله' : 'معتذر';
      const companions = r.companionCount || 0;
      const totalPersons = r.status === 'attending' ? 1 + companions : 0;
      const chatVisible = r.isVisibleInChat !== false ? 'نعم' : 'مخفي';
      rows.push([
        `"${r.guestName.replace(/"/g, '""')}"`,
        `"${statusArabic}"`,
        `${companions}`,
        `${totalPersons}`,
        `"${(r.phone || '').replace(/"/g, '""')}"`,
        `"${(r.message || '').replace(/"/g, '""')}"`,
        `"${chatVisible}"`,
        `"${new Date(r.createdAt).toLocaleString('ar-SA')}"`
      ]);
    }

    const csvContent = '\uFEFF' + rows.map(e => e.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="wedding_rsvps.csv"');
    res.send(csvContent);
  });

  // --- Backup and Restore Endpoints ---

  app.get('/api/backup/export', requireAdmin, (_req: Request, res: Response) => {
    const backup = db.exportFullBackup();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="wedding_backup_${Date.now()}.json"`);
    res.send(JSON.stringify(backup, null, 2));
  });

  app.post('/api/backup/restore', requireAdmin, (req: Request, res: Response) => {
    const payload = req.body;
    if (!payload || !payload.published) {
      res.status(400).json({ error: 'ملف النسخة الاحتياطية غير صالح أو تالف' });
      return;
    }
    const success = db.restoreBackup(payload);
    if (success) {
      res.json({ success: true, message: 'تم استعادة النسخة الاحتياطية بنجاح' });
    } else {
      res.status(500).json({ error: 'فشل استعادة النسخة الاحتياطية' });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wedding invitation server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
