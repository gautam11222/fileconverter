import express, { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import { FileConverterService } from "./file-converter.js";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
const upload = multer({ dest: "uploads/" });
const converter = new FileConverterService();

// ------------------------
// Middleware
// ------------------------

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const pathName = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (pathName.startsWith("/api")) {
      let logLine = `${req.method} ${pathName} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 120) {
        logLine = logLine.slice(0, 119) + "…";
      }
      log(logLine);
    }
  });

  next();
});

// ------------------------
// Health Check Endpoint
// ------------------------
app.get("/healthz", (_req: Request, res: Response) => {
  res.status(200).send("OK");
});

// ------------------------
// File Conversion Endpoint
// ------------------------
app.post("/api/convert", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const inputPath = req.file.path;
    const outputExt = req.query.to as string; // e.g. ?to=.docx

    if (!outputExt) {
      return res.status(400).json({ message: "Missing 'to' query param (e.g. ?to=.docx)" });
    }

    const outputPath = await converter.convertDocument(inputPath, outputExt);

    res.download(outputPath, path.basename(outputPath), (err) => {
      if (err) {
        console.error("Download error:", err);
        res.status(500).json({ message: "File download failed" });
      }
    });
  } catch (err: any) {
    console.error("Conversion failed:", err);
    res.status(500).json({ message: err.message || "Conversion failed" });
  }
});

// ------------------------
// Main Async Function
// ------------------------

(async () => {
  try {
    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      log(`Error occurred: ${message}`);
    });

    // Setup Vite dev server or serve static files
    if (app.get("env") === "development") {
      await setupVite(app);
    } else {
      serveStatic(app);
    }

    const port = parseInt(process.env.PORT || "5000", 10);

    app.listen(port, () => {
      log(`🚀 Server is running on http://localhost:${port} [${app.get("env")}]`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
})();
