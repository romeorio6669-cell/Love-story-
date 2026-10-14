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
const BACKUP_FILE = path.join(DATA_DIR, 'wedding_database.backup.json');

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

// Deep clone utility
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Ensure full invitation data structure integrity
function sanitizeInvitationData(data: Partial<InvitationData> | undefined): InvitationData {
  const merged: InvitationData = {
    ...defaultInvitationData,
    ...(data || {})
  };
  merged.photos = Array.isArray(data?.photos) ? deepClone(data!.photos) : deepClone(defaultInvitationData.photos);
  merged.videos = Array.isArray(data?.videos) ? deepClone(data!.videos) : deepClone(defaultInvitationData.videos);
  merged.timeline = Array.isArray(data?.timeline) ? deepClone(data!.timeline) : deepClone(defaultInvitationData.timeline);
  merged.customSections = Array.isArray(data?.customSections) ? deepClone(data!.customSections) : deepClone(defaultInvitationData.customSections);
  merged.sectionsOrder = Array.isArray(data?.sectionsOrder) && data!.sectionsOrder.length > 0
    ? deepClone(data!.sectionsOrder)
    : deepClone(defaultInvitationData.sectionsOrder);
  merged.hiddenSections = Array.isArray(data?.hiddenSections) ? deepClone(data!.hiddenSections) : [];
  return merged;
}

// Initialize and manage database with dual-write backup and persistent cross-device storage
class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    let loaded = false;

    // 1. Try reading primary database file
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.data = this.normalizeLoadedData(parsed);
          loaded = true;
        }
      } catch (err) {
        console.error('Primary database file corrupted, trying backup file...', err);
      }
    }

    // 2. Fallback to mirror backup file if primary failed or does not exist
    if (!loaded && fs.existsSync(BACKUP_FILE)) {
      try {
        const rawBackup = fs.readFileSync(BACKUP_FILE, 'utf-8');
        const parsedBackup = JSON.parse(rawBackup);
        if (parsedBackup && typeof parsedBackup === 'object') {
          this.data = this.normalizeLoadedData(parsedBackup);
          loaded = true;
          console.log('Successfully recovered database from mirror backup!');
          this.save();
        }
      } catch (backupErr) {
        console.error('Mirror backup also corrupted:', backupErr);
      }
    }

    // 3. Fallback to initial default data only if neither file exists
    if (!loaded) {
      console.log('No existing database found. Initializing new persistent store.');
      this.data = this.createInitialData();
      this.save();
    }
  }

  private normalizeLoadedData(parsed: any): DatabaseSchema {
    const published = sanitizeInvitationData(parsed.published);
    const draft = sanitizeInvitationData(parsed.draft || parsed.published);
    const rsvps = Array.isArray(parsed.rsvps) ? parsed.rsvps : [];
    const sessions = parsed.sessions && typeof parsed.sessions === 'object' ? parsed.sessions : {};
    const admin = parsed.admin && typeof parsed.admin === 'object'
      ? {
          isConfigured: !!parsed.admin.isConfigured,
          username: parsed.admin.username || '',
          salt: parsed.admin.salt || '',
          passwordHash: parsed.admin.passwordHash || '',
          updatedAt: parsed.admin.updatedAt || new Date().toISOString()
        }
      : {
          isConfigured: false,
          username: '',
          salt: '',
          passwordHash: '',
          updatedAt: new Date().toISOString()
        };

    return { admin, published, draft, rsvps, sessions };
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
      published: sanitizeInvitationData(defaultInvitationData),
      draft: sanitizeInvitationData(defaultInvitationData),
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
    try {
      const payload = JSON.stringify(this.data, null, 2);
      const tmp = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmp, payload, 'utf-8');
      fs.renameSync(tmp, DB_FILE);

      // Mirror write to persistent backup file
      fs.writeFileSync(BACKUP_FILE, payload, 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
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
    return deepClone(this.data.published);
  }

  public getDraft(): InvitationData {
    return deepClone(this.data.draft);
  }

  public updateDraft(draft: InvitationData): void {
    this.data.draft = sanitizeInvitationData(draft);
    this.save();
  }

  public publishDraft(): InvitationData {
    this.data.published = sanitizeInvitationData(this.data.draft);
    this.save();
    return deepClone(this.data.published);
  }

  public discardDraft(): InvitationData {
    this.data.draft = sanitizeInvitationData(this.data.published);
    this.save();
    return deepClone(this.data.draft);
  }

  public verifyAdmin(username: string, passwordAttempt: string): boolean {
    try {
      if (!this.isConfigured()) return false;
      if (!username || !passwordAttempt) return false;
      if (this.data.admin.username.trim().toLowerCase() !== username.trim().toLowerCase()) {
        return false;
      }
      if (!this.data.admin.salt || !this.data.admin.passwordHash) {
        return false;
      }
      const attemptHash = hashPassword(passwordAttempt, this.data.admin.salt);
      const validHashBuf = Buffer.from(this.data.admin.passwordHash, 'hex');
      const attemptHashBuf = Buffer.from(attemptHash, 'hex');
      if (validHashBuf.length !== attemptHashBuf.length) {
        return false;
      }
      return crypto.timingSafeEqual(validHashBuf, attemptHashBuf);
    } catch (err) {
      console.error('Admin authentication verification error:', err);
      return false;
    }
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

  // Anti-cache middleware for all API routes to ensure real-time multi-device sync
  app.use(['/api', '/api/*', '/admin/api', '/admin/api/*'], (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  // Helper auth middleware with Bearer header & query token fallback (for browser downloads)
  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (!token) {
      res.status(401).json({ error: 'غير مصرح: يجب تسجيل الدخول كمسؤول للقيام بهذه العملية' });
      return;
    }
    if (!db.validateSession(token)) {
      res.status(401).json({ error: 'انتهت صلاحية الجلسة، يرجى إعادة تسجيل الدخول' });
      return;
    }
    next();
  };

  // --- Auth Endpoints ---

  const authSetupStatusPaths = [
    '/api/auth/setup-status',
    '/api/admin/setup-status',
    '/api/setup-status'
  ];

  const authSetupPaths = [
    '/api/auth/setup',
    '/api/admin/setup',
    '/api/setup'
  ];

  const authLoginPaths = [
    '/api/auth/login',
    '/api/admin/login',
    '/api/login',
    '/admin/login'
  ];

  const authMePaths = [
    '/api/auth/me',
    '/api/admin/me',
    '/api/me'
  ];

  const authLogoutPaths = [
    '/api/auth/logout',
    '/api/admin/logout',
    '/api/logout'
  ];

  const authChangeCredsPaths = [
    '/api/auth/change-credentials',
    '/api/admin/change-credentials',
    '/api/change-credentials'
  ];

  // Check whether administrator account is initialized
  app.get(authSetupStatusPaths, (_req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json({
        success: true,
        isConfigured: db.isConfigured()
      });
    } catch (err: any) {
      res.status(500).setHeader('Content-Type', 'application/json; charset=utf-8').json({
        success: false,
        error: 'خطأ في فحص حالة إعداد المسؤول'
      });
    }
  });

  // First-time administrator creation
  app.post(authSetupPaths, (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
      if (db.isConfigured()) {
        res.status(400).json({ success: false, error: 'تم إعداد حساب المسؤول مسبقاً، يرجى تسجيل الدخول' });
        return;
      }

      const body = req.body || {};
      const username = typeof body.username === 'string' ? body.username.trim() : '';
      const password = typeof body.password === 'string' ? body.password : '';

      if (!username || username.length < 3) {
        res.status(400).json({ success: false, error: 'يجب أن لا يقل اسم المستخدم عن 3 أحرف' });
        return;
      }
      if (!password || password.length < 6) {
        res.status(400).json({ success: false, error: 'يجب أن لا تقل كلمة المرور عن 6 أحرف أو أرقام' });
        return;
      }

      db.setupAdmin(username, password);
      const token = db.createSession(username);

      res.status(200).json({
        success: true,
        token,
        admin: db.getAdminInfo(),
        message: 'تم إنشاء بيانات المسؤول بنجاح والدخول إلى لوحة التحكم'
      });
    } catch (err: any) {
      console.error('Setup endpoint error:', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'فشل إعداد حساب المسؤول بسبب خطأ في الخادم'
      });
    }
  });

  // Admin login endpoint
  app.post(authLoginPaths, (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
      if (!db.isConfigured()) {
        res.status(400).json({
          success: false,
          needsSetup: true,
          error: 'الموقع يحتاج إلى إعداد حساب المسؤول لأول مرة'
        });
        return;
      }

      const body = req.body || {};
      const username = typeof body.username === 'string' ? body.username.trim() : '';
      const password = typeof body.password === 'string' ? body.password : '';

      if (!username || !password) {
        res.status(400).json({
          success: false,
          error: 'اسم المستخدم وكلمة المرور مطلوبان'
        });
        return;
      }

      if (!db.verifyAdmin(username, password)) {
        res.status(401).json({
          success: false,
          error: 'اسم المستخدم أو كلمة المرور غير صحيحة'
        });
        return;
      }

      const token = db.createSession(username);
      res.status(200).json({
        success: true,
        token,
        admin: db.getAdminInfo(),
        message: 'تم تسجيل الدخول بنجاح'
      });
    } catch (err: any) {
      console.error('Login endpoint error:', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'فشل تسجيل الدخول بسبب خطأ في الخادم'
      });
    }
  });

  app.get(authMePaths, (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.json({ authenticated: false, isConfigured: db.isConfigured() });
        return;
      }
      const token = authHeader.split(' ')[1];
      const isValid = db.validateSession(token);
      if (isValid) {
        res.json({ success: true, authenticated: true, admin: db.getAdminInfo(), isConfigured: db.isConfigured() });
      } else {
        res.json({ success: true, authenticated: false, isConfigured: db.isConfigured() });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'خطأ في التحقق من الجلسة' });
    }
  });

  app.post(authLogoutPaths, (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        db.invalidateSession(token);
      }
      res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'خطأ أثناء تسجيل الخروج' });
    }
  });

  app.post(authChangeCredsPaths, requireAdmin, (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
      const { currentPassword, newUsername, newPassword } = req.body || {};
      const currentAdmin = db.getAdminInfo();

      if (!db.verifyAdmin(currentAdmin.username, currentPassword)) {
        res.status(400).json({ success: false, error: 'كلمة المرور الحالية غير صحيحة' });
        return;
      }

      if (newPassword && newPassword.length < 6) {
        res.status(400).json({ success: false, error: 'يجب أن لا تقل كلمة المرور الجديدة عن 6 أحرف أو أرقام' });
        return;
      }

      db.changeAdminCredentials(newUsername, newPassword);
      res.json({ success: true, message: 'تم تحديث بيانات المسؤول بنجاح' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'خطأ في تحديث البيانات' });
    }
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

  // --- Guaranteed JSON Catch-All for API Routes ---
  // Ensures unmatched API requests NEVER fall into Vite/SPA HTML fallback or return HTML
  app.all(['/api', '/api/*', '/admin/api', '/admin/api/*'], (req: Request, res: Response) => {
    res.status(404).setHeader('Content-Type', 'application/json; charset=utf-8').json({
      success: false,
      error: `المسار البرمجي المطلوب غير متوفر على الخادم (${req.method} ${req.originalUrl})`
    });
  });

  // Global Error Handler for API requests
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }
    console.error('Unhandled server error:', err);
    const isApi = req.path.startsWith('/api') || req.path.startsWith('/admin/api');
    if (isApi) {
      res.status(err.status || 500).setHeader('Content-Type', 'application/json; charset=utf-8').json({
        success: false,
        error: err.message || 'حدث خطأ داخلي في الخادم'
      });
    } else {
      next(err);
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
