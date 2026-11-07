const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const pino = require("pino");
const express = require("express");
const { recibir } = require("./rpg");

const app = express();
app.get("/", (req, res) => res.send("Bot RPG activo"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor web en puerto " + PORT));

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    browser: ["Mi RPG Bot", "Chrome", "1.0.0"],
  });

  if (!state.creds.registered) {
    const phone = (process.env.PHONE_NUMBER || "").replace(/\D/g, "");
    if (phone) {
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(phone);
          console.log("Código de vinculación: " + code);
          console.log("En WhatsApp del bot: Dispositivos vinculados > Vincular con número de teléfono > escribe ese código");
        } catch (e) {
          console.log("No se pudo generar el código de vinculación:", e.message);
        }
      }, 3000);
    }
  }

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log("Escanea este QR con el número del bot:");
      qrcode.generate(qr, { small: true });
    }
    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log("Conexión cerrada. ¿Reconectar?", shouldReconnect);
      if (shouldReconnect) start();
      else console.log("Sesión cerrada. Borra la carpeta auth y vuelve a desplegar para vincular de nuevo.");
    } else if (connection === "open") {
      console.log("Bot conectado a WhatsApp. Ya puedes probar ,menu");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;
    if (m.key.remoteJid === "status@broadcast") return;

    const texto =
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      m.message.imageMessage?.caption ||
      "";

    if (!texto.trim().startsWith(",")) return;

    const esGrupo = m.key.remoteJid.endsWith("@g.us");
    const idJugador = esGrupo ? (m.key.participant || m.key.remoteJid) : m.key.remoteJid;
    const nombre = m.pushName || "Jugador";
    const menciones = m.message.extendedTextMessage?.contextInfo?.mentionedJid || [];

    try {
      const respuesta = recibir(idJugador, nombre, texto, menciones);
      if (respuesta) {
        await sock.sendMessage(m.key.remoteJid, { text: respuesta }, { quoted: m });
      }
    } catch (e) {
      console.log("Error al responder:", e);
    }
  });
}

start();
         
