import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import fs from "fs";
import { Store } from "express-session";
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  WASocket,
  initAuthCreds,
  BufferJSON,
  proto
} from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";
import dotenv from "dotenv";

// 1. Load Environment Variables
dotenv.config();
console.log("🚀 God First initializing...");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Initialize Supabase with your specific .env keys
// Note: We use the VITE_ prefix to match your .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl) {
  console.error("❌ ERROR: VITE_SUPABASE_URL is missing in .env/environment");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY is missing. WhatsApp Bot might have permission issues on Railway.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Session Type Definition
declare module 'express-session' {
  interface SessionData {
    user: {
      phone: string;
      name: string;
      is_admin: number;
    };
  }
}

// Custom Supabase Session Store
class SupabaseSessionStore extends Store {
  async get(sid: string, callback: (err: any, session?: any | null) => void) {
    try {
      const { data, error } = await supabase.from("sessions").select("sess, expire").eq("sid", sid).single();
      if (error && error.code !== "PGRST116") return callback(new Error(error.message || "Session GET error"));
      if (!data) return callback(null, null);

      if (new Date(data.expire).getTime() < Date.now()) {
        await this.destroy(sid, () => { });
        return callback(null, null);
      }
      return callback(null, data.sess);
    } catch (err: any) {
      callback(new Error(err.message || String(err)));
    }
  }

  async set(sid: string, session: any, callback?: (err?: any) => void) {
    try {
      // express-session defaults to cookie.maxAge / expires
      const ttl = session.cookie && session.cookie.maxAge ? session.cookie.maxAge : 24 * 60 * 60 * 1000;
      const expire = new Date(Date.now() + ttl).toISOString();

      const { error } = await supabase.from("sessions").upsert({ sid, sess: session, expire });
      if (error && callback) callback(new Error(error.message || "Session SET error"));
      else if (callback) callback();
    } catch (err: any) {
      if (callback) callback(new Error(err.message || String(err)));
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void) {
    try {
      const { error } = await supabase.from("sessions").delete().eq("sid", sid);
      if (error && callback) callback(new Error(error.message || "Session DESTROY error"));
      else if (callback) callback();
    } catch (err: any) {
      if (callback) callback(new Error(err.message || String(err)));
    }
  }

  async touch(sid: string, session: any, callback?: (err?: any) => void) {
    // Only update expiration
    const ttl = session.cookie && session.cookie.maxAge ? session.cookie.maxAge : 24 * 60 * 60 * 1000;
    const expire = new Date(Date.now() + ttl).toISOString();
    try {
      const { error } = await supabase.from("sessions").update({ expire }).eq("sid", sid);
      if (error && callback) callback(new Error(error.message || "Session TOUCH error"));
      else if (callback) callback();
    } catch (err: any) {
      if (callback) callback(new Error(err.message || String(err)));
    }
  }
}

// Supabase Auth State for Baileys
async function useSupabaseAuthState() {
  const readData = async (id: string) => {
    try {
      const { data, error } = await supabase.from("baileys_auth").select("data").eq("id", id).single();
      if (error && error.code !== "PGRST116") {
        return undefined;
      }
      return data ? JSON.parse(data.data, BufferJSON.reviver) : undefined;
    } catch (error) {
      console.error(`[WA-AUTH] Parse Error (${id}):`, error);
      return undefined;
    }
  };

  const writeData = async (data: any, id: string) => {
    const stringified = JSON.stringify(data, BufferJSON.replacer);
    await supabase.from("baileys_auth").upsert({ id, data: stringified });
  };

  const removeData = async (id: string) => {
    await supabase.from("baileys_auth").delete().eq("id", id);
  };

  const creds = (await readData("creds")) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type: string, ids: string[]) => {
          const data: { [key: string]: any } = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === "app-state-sync-key" && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              if (value !== undefined) {
                data[id] = value;
              }
            })
          );
          return data;
        },
        set: async (data: any) => {
          const tasks: Promise<any>[] = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              tasks.push(value ? writeData(value, key) : removeData(key));
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: () => writeData(creds, "creds"),
  };
}

// WhatsApp Logic
let sock: WASocket | null = null;
let qrCode: string | null = null;
let connectionStatus: "connecting" | "open" | "close" | "qr" = "connecting";

async function connectToWhatsApp(retry = true) {
  try {
    console.log("[WA-SOCKET] Initializing...");
    const { state, saveCreds } = await useSupabaseAuthState();
    console.log("[WA-SOCKET] Auth state loaded");
    console.log("[WA-SOCKET] Fetching Baileys version...");
    let version;
    try {
      const vResult = await fetchLatestBaileysVersion();
      version = vResult.version;
      console.log(`[WA-SOCKET] Fetched Version: ${version.join(".")}`);
    } catch (vErr) {
      console.warn("[WA-SOCKET] Failed to fetch version, using default", vErr);
      version = [6, 0, 0]; // Fallback
    }

    sock = makeWASocket({
      version,
      printQRInTerminal: true,
      auth: state,
      logger: pino({ level: "silent" }),
    });

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;
      console.log(`[WA-SOCKET] Connection Update: ${connection || "none"}`);

      if (qr) {
        qrCode = await QRCode.toDataURL(qr);
        connectionStatus = "qr";
        console.log("[WA-SOCKET] New QR Code generated.");
      }

      if (connection === "open") {
        connectionStatus = "open";
        qrCode = null;
        console.log("✅ GOD FIRST WhatsApp connection opened!");
      }

      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        console.log(`[WA-SOCKET] Closed. Status: ${statusCode}`, lastDisconnect?.error);
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        connectionStatus = "close";
        if (shouldReconnect) {
          console.log("[WA-SOCKET] Reconnecting...");
          connectToWhatsApp();
        } else {
          console.log("WhatsApp connection logged out. Clearing auth data...");
          await supabase.from("baileys_auth").delete().neq("id", "0");
          connectToWhatsApp();
        }
      }
    });

    sock.ev.on("creds.update", saveCreds);

    // --- WhatsApp Command Listener ---
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;
      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;
        const jid = msg.key.remoteJid;
        if (!jid) continue;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const phone = jid.split("@")[0].replace("266", ""); // Extract phone (SL specific 266 prefix)

        if (text.startsWith("!")) {
          console.log(`[WA-CMD] From ${phone}: ${text}`);

          // 1. Fetch User Data
          const { data: member } = await supabase.from("members").select("*").eq("phone", phone).single();
          if (!member) {
            await sock?.sendMessage(jid, { text: "❌ You are not registered in God First. Please contact the administrator." });
            continue;
          }

          if (text === "!balance") {
            const reply = `*God First Balance Summary*\n\n👤 Member: ${member.name}\n💰 Savings: M${(member.savings || 0).toLocaleString()}\n💸 Active Loan: M${(member.current_loan || 0).toLocaleString()}\n\n_Keep saving for a better tomorrow!_`;
            await sock?.sendMessage(jid, { text: reply });
          }

          else if (text.startsWith("!goal ")) {
            const amountStr = text.split(" ")[1];
            const amount = parseFloat(amountStr);
            if (isNaN(amount) || amount <= 0) {
              await sock?.sendMessage(jid, { text: "❌ Invalid amount. Use: `!goal 5000`" });
            } else {
              await supabase.from("members").update({ savings_goal: amount }).eq("phone", phone);
              await sock?.sendMessage(jid, { text: `✅ Your savings goal has been updated to *M${amount.toLocaleString()}*!` });
            }
          }

          else if (text === "!status") {
            const { data: allMembers } = await supabase.from("members").select("savings");
            const totalGroupSavings = (allMembers || []).reduce((acc, m) => acc + (m.savings || 0), 0);
            const reply = `*God First Club Status*\n\n👥 Total Members: ${allMembers?.length || 0}\n🌍 Group Savings: M${totalGroupSavings.toLocaleString()}\n\n📈 Your Contribution: ${totalGroupSavings > 0 ? ((member.savings / totalGroupSavings) * 100).toFixed(1) : 0}%\n\n_Unity is Strength._`;
            await sock?.sendMessage(jid, { text: reply });
          }
        }
      }
    });
  } catch (err) {
    console.error("WhatsApp connection error:", err);
    if (retry) {
      // Clear all keys from Supabase db (equivalent of rmSync)
      await supabase.from("baileys_auth").delete().neq("id", "0");
      connectToWhatsApp(false);
    }
  }
}

connectToWhatsApp();

async function startServer() {
  console.log("--- STARTUP DIAGNOSTICS ---");
  console.log(`Node Version: ${process.version}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Supabase URL detected: ${!!supabaseUrl}`);
  console.log(`Service Role Key detected: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);
  console.log(`Anon Key detected: ${!!process.env.VITE_SUPABASE_ANON_KEY}`);
  console.log(`Session Secret detected: ${!!process.env.SESSION_SECRET}`);
  console.log("---------------------------");

  const app = express();
  app.set('trust proxy', true);
  app.use(express.json());
  app.use(cookieParser());

  app.use(session({
    store: new SupabaseSessionStore(),
    name: 'godfirst.sid',
    secret: "god-first-secret-key",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      // during development we serve over HTTP so don't require secure;
      // flip to true when the app is behind HTTPS in production
      secure: process.env.NODE_ENV === "production",
      sameSite: 'lax',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Health check for Render/Cloud
  app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));
  app.get("/health", (req, res) => res.send("OK"));

  app.use(cors({
    origin: true,
    credentials: true
  }));

  // Middlewares
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.session.user) return next();
    res.status(401).json({ error: "Unauthorized" });
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    console.log(`[AUTH-CHECK] Phone: ${req.session.user?.phone}, isAdmin: ${req.session.user?.is_admin} (${typeof req.session.user?.is_admin})`);
    if (req.session.user && (req.session.user.is_admin === 1 || req.session.user.is_admin === true || String(req.session.user.is_admin) === "1")) return next();
    res.status(403).json({ error: "Admin access required" });
  };

  // --- API ROUTES ---

  app.post("/api/admin/send-summaries", requireAdmin, async (req, res) => {
    console.log("[SUMMARY-BLAST] Starting...");
    if (!sock || connectionStatus !== "open") {
      console.error("[SUMMARY-BLAST] Failed: WhatsApp not connected");
      return res.status(503).json({ error: "WhatsApp bot is not connected" });
    }

    try {
      const { data: members, error } = await supabase.from("members").select("*");
      if (error) throw error;

      console.log(`[SUMMARY-BLAST] Found ${members?.length || 0} members`);

      let successCount = 0;
      let failCount = 0;

      for (const m of (members || [])) {
        try {
          const cleanPhone = m.phone.replace(/\D/g, "");
          const jid = cleanPhone.startsWith("266") ? cleanPhone : "266" + cleanPhone;
          const fullJid = `${jid}@s.whatsapp.net`;

          console.log(`[SUMMARY-BLAST] Sending to ${m.name} (${fullJid})...`);

          const msg = `*God First Monthly Summary* 📈\n\nHello ${m.name},\n\nHere is your current account status:\n💰 *Savings*: M${(m.savings || 0).toLocaleString()}\n💸 *Loan Balance*: M${(m.current_loan || 0).toLocaleString()}\n🎯 *Goal*: M${(m.savings_goal || 0).toLocaleString()}\n\nKeep up the great work! Together we grow. 💪`;

          await sock.sendMessage(fullJid, { text: msg });
          successCount++;
          console.log(`[SUMMARY-BLAST] ✅ Sent to ${fullJid}`);
        } catch (err) {
          console.error(`[SUMMARY-BLAST] ❌ Failed for ${m.phone}:`, err);
          failCount++;
        }
      }

      res.json({ success: true, sent: successCount, failed: failCount });
    } catch (err) {
      console.error("[SUMMARY-BLAST] Critical failure:", err);
      res.status(500).json({ error: "Failed to send summaries" });
    }
  });


  app.get("/api/whatsapp/status", (req, res) => {
    res.json({ status: connectionStatus, qr: qrCode });
  });

  app.post("/api/auth/request-otp", async (req, res) => {
    try {
      const { phone } = req.body;
      // ensure the number exists in members table; create a stub if missing
      let { data: member, error: memberErr } = await supabase
        .from("members")
        .select("*")
        .eq("phone", phone)
        .single();

      if (memberErr && memberErr.code !== "PGRST116") {
        console.error("Supabase member lookup error:", memberErr);
        return res.status(500).json({ error: "Database lookup failed" });
      }

      if (!member) {
        const { data: newMember, error: insertErr } = await supabase
          .from("members")
          .insert({ phone, name: phone, is_admin: 0 })
          .single();
        if (insertErr) {
          console.error("Failed to insert member during OTP request:", insertErr);
          return res.status(500).json({ error: "Could not create member" });
        }
        member = newMember;
      }

      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      await supabase.from("otps").upsert({ phone, code: otp, expires_at: expiresAt });

      if (connectionStatus === "open" && sock) {
        const cleanPhone = phone.replace(/\D/g, "");
        const jid = cleanPhone.startsWith("266") ? cleanPhone : "266" + cleanPhone;
        await sock.sendMessage(`${jid}@s.whatsapp.net`, {
          text: `*God First Security*\n\nYour login code is: *${otp}*`
        });
      }

      res.json({ success: true, message: "OTP Sent" });
    } catch (err) {
      console.error("/api/auth/request-otp failed:", err);
      res.status(500).json({ error: "Internal error" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { phone, code } = req.body;
      const { data: otpRecord } = await supabase.from("otps").select("*").eq("phone", phone).eq("code", code).single();

      if (!otpRecord || new Date(otpRecord.expires_at) < new Date()) {
        return res.status(400).json({ error: "Invalid or expired code" });
      }

      const { data: member } = await supabase.from("members").select("*").eq("phone", phone).single();
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      // set session and force save so cookie is written before we respond
      req.session.user = { phone: member.phone, name: member.name, is_admin: member.is_admin };
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Internal error" });
        }
        res.json(member);
      });

      // delete the OTP so it can't be reused
      await supabase.from("otps").delete().eq("phone", phone);
    } catch (err) {
      console.error("/api/auth/verify-otp failed:", err);
      res.status(500).json({ error: "Internal error" });
    }
  });

  // return current session user (if any)
  app.get("/api/auth/me", (req, res) => {
    if (req.session.user) {
      return res.json(req.session.user);
    }
    res.status(401).json({ error: "Not authenticated" });
  });

  // clear session cookie
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie('godfirst.sid');
      res.json({ success: true });
    });
  });

  // create a new transaction request (saving or loan) by an authenticated member
  app.post("/api/transactions", requireAuth, async (req, res) => {
    try {
      const { member_phone, amount, type, proof_ref, reason } = req.body;

      // Fetch current member details for snapshot and validation
      const { data: member, error: memberError } = await supabase
        .from("members")
        .select("savings")
        .eq("phone", member_phone)
        .single();

      if (memberError || !member) {
        return res.status(404).json({ error: "Member not found" });
      }

      const currentSavings = member.savings || 0;

      // Enforcement: Loan limit (3x savings)
      if (type === "loan" && amount > currentSavings * 3) {
        return res.status(400).json({
          error: `Loan request exceeds limit. Based on your M${currentSavings.toLocaleString()} savings, your maximum eligible loan is M${(currentSavings * 3).toLocaleString()}.`
        });
      }

      const { data, error } = await supabase
        .from("transactions")
        .insert({
          member_phone,
          amount,
          type,
          proof_ref,
          reason,
          member_savings_at_time: currentSavings
        })
        .select()
        .single();

      if (error) {
        console.error("create transaction error", error);
        return res.status(500).json({ error: "Failed to create transaction" });
      }

      // --- Notify Admins via WhatsApp ---
      if (sock && connectionStatus === "open") {
        try {
          const { data: admins } = await supabase.from("members").select("phone, name").eq("is_admin", 1);
          const { data: requester } = await supabase.from("members").select("name").eq("phone", member_phone).single();

          const adminMsg = `🔔 *New Transaction Request*\n\n👤 Member: ${requester?.name || member_phone}\n💰 Amount: M${amount.toLocaleString()}\n📝 Type: ${type.toUpperCase()}\n📄 Reason: ${reason || "N/A"}\n\n_Please review in the Admin Approval Center._`;

          for (const admin of (admins || [])) {
            const cleanPhone = admin.phone.replace(/\D/g, "");
            const jid = cleanPhone.startsWith("266") ? cleanPhone : "266" + cleanPhone;
            await sock.sendMessage(`${jid}@s.whatsapp.net`, { text: adminMsg });
          }
        } catch (notifyErr) {
          console.error("Failed to notify admins:", notifyErr);
        }
      }

      res.json(data);
    } catch (err) {
      console.error("/api/transactions POST failed", err);
      res.status(500).json({ error: "Internal error" });
    }
  });

  app.get("/api/members", requireAuth, async (req, res) => {
    const { data } = await supabase.from("members").select("*").order("name");
    res.json(data || []);
  });

  app.get("/api/transactions", requireAuth, async (req, res) => {
    const { data } = await supabase.from("transactions").select("*, members(name)").order("created_at", { ascending: false });
    res.json(data || []);
  });

  // --- PROFILE ENDPOINTS ---
  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("members")
        .select("phone, name, location_info, savings_goal, avatar_url, savings, current_loan, loan_repayment")
        .eq("phone", req.session.user?.phone)
        .single();

      if (error) return res.status(500).json({ error: "Failed to fetch profile" });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: "Internal error" });
    }
  });

  app.put("/api/profile", requireAuth, async (req, res) => {
    try {
      const { name, location_info, savings_goal, avatar_url } = req.body;
      const phone = req.session.user?.phone;

      const { data, error } = await supabase
        .from("members")
        .update({ name, location_info, savings_goal, avatar_url })
        .eq("phone", phone)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });

      // Update session if name changed
      if (req.session.user) {
        req.session.user.name = data.name;
        req.session.user.is_admin = data.is_admin;
        req.session.save();
      }

      res.json(data);
    } catch (err) {
      res.status(500).json({ error: "Internal error" });
    }
  });

  app.post("/api/transactions/approve", requireAdmin, async (req, res) => {
    const { id } = req.body;
    const { data: tr } = await supabase.from("transactions").select("*").eq("id", id).single();

    if (!tr) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // load the affected member
    const { data: m } = await supabase.from("members").select("*").eq("phone", tr.member_phone).single();
    if (!m) {
      return res.status(404).json({ error: "Member not found" });
    }

    // compute updated fields depending on type
    let newSavings = m.savings || 0;
    let newLoan = m.current_loan || 0;

    if (tr.type === "saving") {
      newSavings += tr.amount;
    } else if (tr.type === "loan") {
      newLoan += tr.amount;
    }

    // simple 10% interest on outstanding loan
    const loanRepayment = newLoan > 0 ? newLoan * 1.1 : 0;

    // update member record
    await supabase
      .from("members")
      .update({
        savings: newSavings,
        current_loan: newLoan,
        loan_repayment: loanRepayment,
      })
      .eq("phone", tr.member_phone);

    // mark transaction verified
    await supabase.from("transactions").update({ status: "verified" }).eq("id", id);

    // notify user via WhatsApp if connected
    if (sock && connectionStatus === "open") {
      let msg = `✅ Transaction approved!\nAmount: M${tr.amount}`;
      if (tr.type === "saving") {
        msg += `\nNew Savings Balance: M${newSavings}`;
      } else if (tr.type === "loan") {
        msg += `\nNew Loan Balance: M${newLoan}`;
      }
      const cleanPhone = tr.member_phone.replace(/\D/g, "");
      const jid = cleanPhone.startsWith("266") ? cleanPhone : "266" + cleanPhone;
      await sock.sendMessage(`${jid}@s.whatsapp.net`, { text: msg });
    }

    res.json({ success: true });
  });

  app.post("/api/transactions/reject", requireAdmin, async (req, res) => {
    const { id } = req.body;
    const { data: tr } = await supabase.from("transactions").select("*").eq("id", id).single();

    if (!tr) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // mark transaction rejected
    await supabase.from("transactions").update({ status: "rejected" }).eq("id", id);

    // notify user via WhatsApp if connected
    if (sock && connectionStatus === "open") {
      let msg = `❌ Transaction rejected.\nAmount: M${tr.amount}`;
      const cleanPhone = tr.member_phone.replace(/\D/g, "");
      const jid = cleanPhone.startsWith("266") ? cleanPhone : "266" + cleanPhone;
      await sock.sendMessage(`${jid}@s.whatsapp.net`, { text: msg });
    }

    res.json({ success: true });
  });



  app.post("/api/members", requireAdmin, async (req, res) => {
    try {
      const memberData = req.body;
      const { data, error } = await supabase.from("members").insert([memberData]).select().single();
      if (error) return res.status(500).json({ error: error.message });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: "Internal error" });
    }
  });

  app.put("/api/members/:phone", requireAdmin, async (req, res) => {
    try {
      const { phone } = req.params;
      const memberData = req.body;
      const { data, error } = await supabase.from("members").update(memberData).eq("phone", phone).select().single();
      if (error) return res.status(500).json({ error: error.message });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: "Internal error" });
    }
  });

  app.delete("/api/members/:phone", requireAdmin, async (req, res) => {
    try {
      const { phone } = req.params;
      const { error } = await supabase.from("members").delete().eq("phone", phone);
      if (error) return res.status(500).json({ error: error.message });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Internal error" });
    }
  });

  // Vite/Static Setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => res.sendFile(path.resolve(__dirname, "dist", "index.html")));
  }

  const PORT = process.env.PORT || 3000;
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 God First Server running at http://localhost:${PORT}`);
  });
}

startServer();