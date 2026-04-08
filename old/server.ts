
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock database for WhatsApp logs (in-memory for demo)
  const whatsappLogs: any[] = [];

  // API Route: Send WhatsApp Reminder
  app.post("/api/whatsapp/send", async (req, res) => {
    const { phone, message, customerName } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: "Phone and message are required" });
    }

    try {
      console.log(`[WhatsApp API] Sending to ${phone}: ${message}`);
      
      // REAL INTEGRATION POINT:
      // In a real scenario, you would call a service like Twilio or Meta WhatsApp Business API here.
      // Example:
      /*
      const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa('YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          To: `whatsapp:${phone}`,
          From: 'whatsapp:YOUR_TWILIO_NUMBER',
          Body: message
        })
      });
      */

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const logEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        phone,
        customerName,
        message,
        status: "SENT"
      };

      whatsappLogs.unshift(logEntry);

      res.json({ success: true, log: logEntry });
    } catch (error) {
      console.error("WhatsApp API Error:", error);
      res.status(500).json({ error: "Failed to send WhatsApp message" });
    }
  });

  // API Route: Get WhatsApp Logs
  app.get("/api/whatsapp/logs", (req, res) => {
    res.json(whatsappLogs);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
