import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path from "path";
import { registerRoutes } from "./routes/index";
import { setupVite, serveStatic, log } from "./vite";
import { TaskReminderScheduler } from "./services/task-reminder-scheduler";
import { VendorDiscoveryScheduler } from "./services/vendor-discovery-scheduler";
import { storage } from "./storage";

const app = express();

// Trust proxy - required for Replit's reverse proxy setup
// This enables express-rate-limit to work correctly with X-Forwarded-For headers
app.set('trust proxy', 1);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// Session configuration
const PgSession = connectPgSimple(session);
app.use(session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: "session",
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || "viah-wedding-secret-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
}));

app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  const method = req.method;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Log request details for API calls
  if (path.startsWith("/api")) {
    const contentLength = req.get('content-length');
    const bodySize = contentLength ? `${(parseInt(contentLength) / 1024).toFixed(1)}KB` : 'unknown';
    log(`→ ${method} ${path} (body: ${bodySize})`);
  }

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      const status = res.statusCode;
      const statusEmoji = status >= 500 ? '✗' : status >= 400 ? '⚠' : '✓';
      let logLine = `← ${statusEmoji} ${method} ${path} ${status} in ${duration}ms`;
      
      // Include error details for failed requests
      if (status >= 400 && capturedJsonResponse) {
        const errorInfo = capturedJsonResponse.error || capturedJsonResponse.message || '';
        if (errorInfo) {
          logLine += ` :: ${errorInfo}`;
        }
      }

      if (logLine.length > 120) {
        logLine = logLine.slice(0, 119) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Serve static files from public folder (sitemap.xml, robots.txt, etc.)
app.use(express.static(path.join(process.cwd(), "public")));

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Initialize task reminder scheduler (checks every hour)
  const taskReminderScheduler = new TaskReminderScheduler(storage);
  taskReminderScheduler.start(60 * 60 * 1000);
  log('Task reminder scheduler started');

  // Initialize vendor discovery scheduler (checks every hour, runs jobs at 2 AM PST)
  const vendorDiscoveryScheduler = new VendorDiscoveryScheduler(storage, { runHour: 2, dailyCap: 50 });
  vendorDiscoveryScheduler.start(60 * 60 * 1000);
  log('Vendor discovery scheduler started');
  (app as any).vendorDiscoveryScheduler = vendorDiscoveryScheduler;

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
