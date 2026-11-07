const fs = require("fs");

const ARCHIVO = "./jugadores.json";
let jugadores = {};

if (fs.existsSync(ARCHIVO)) {
  try {
    jugadores = JSON.parse(fs.readFileSync(ARCHIVO, "utf8"));
  } catch (e) {
    jugadores = {};
  }
}

function guardar() {
  fs.writeFileSync(ARCHIVO, JSON.stringify(jugadores, null, 2));
}

function obtenerJugador(id, nombre) {
  if (!jugadores[id]) {
    jugadores[id] = {
      nombre,
      nivel: 1,
      experiencia: 0,
      monedas: 500,
      vida: 100,
      energia: 100,
      hambre: 100,
      casa: "Ninguna",
      mascota: "Ninguna",
      victorias: 0,
      autobot: false
    };
  }

  jugadores[id].nombre = nombre;
  guardar();
  return jugadores[id];
}

function mostrarPerfil(p) {
  return `╭━━━ 🐻 MI RPG ━━━╮
👤 ${p.nombre}
⭐ Nivel: ${p.nivel}
✨ Experiencia: ${p.experiencia}
💰 Monedas: ${p.monedas}
❤️ Vida: ${p.vida}/100
⚡ Energía: ${p.energia}/100
🍗 Hambre: ${p.hambre}/100
🏡 Casa: ${p.casa}
🐶 Mascota: ${p.mascota}
⚔️ Victorias: ${p.victorias}
╰━━━━━━━━━━━━━━╯`;
}

function recibir(id, nombre, mensaje, menciones = []) {
  const p = obtenerJugador(id, nombre);
  const partes = mensaje.trim().split(/\s+/);
  const comando = partes[0].toLowerCase();
  let respuesta = "";

  switch (comando) {
    case ",menu":
    case ",comandos":
    case ",ayuda":
      respuesta = `🐻 MI RPG
,perfil
,perfil @persona
,monedas
,nivel
,estado
,trabajar
,monstruo
,autobot`;
      break;

    case ",perfil": {
      const objetivo = menciones[0];
      const otro = objetivo && jugadores[objetivo];
      respuesta = objetivo
        ? otro
          ? mostrarPerfil(otro)
          : "👤 Esa persona aún no tiene perfil. ¡Que use ,perfil!"
        : mostrarPerfil(p);
      break;
    }

    case ",monedas":
      respuesta = `💰 ${p.nombre}: ${p.monedas} monedas.`;
      break;

    case ",nivel":
      respuesta = `⭐ Nivel ${p.nivel} | ✨ EXP ${p.experiencia}`;
      break;

    case ",estado":
      respuesta = `❤️ Vida: ${p.vida}/100
⚡ Energía: ${p.energia}/100
🍗 Hambre: ${p.hambre}/100`;
      break;

    case ",trabajar":
      p.monedas += 100;
      p.experiencia += 10;
      if (p.experiencia >= p.nivel * 100) {
        p.experiencia -= p.nivel * 100;
        p.nivel++;
        respuesta = `🎉 ¡Subiste al nivel ${p.nivel}!\n`;
      }
      respuesta += "💼 Trabajaste y ganaste 100 monedas.";
      break;

    case ",autobot":
      p.autobot = true;
      respuesta = "🤫";
      break;

    case ",monstruo":
      if (p.autobot) {
        p.autobot = false;
        p.monedas += 350;
        p.victorias++;
        respuesta = `⚔️ ${p.nombre} derrotó al monstruo y ganó 350 monedas.`;
      } else {
        p.vida = Math.max(0, p.vida - 10);
        respuesta = `👾 ${p.nombre} luchó contra el monstruo y perdió 10 de vida.`;
      }
      break;

    default:
      respuesta = "ʕっ•ᴥ•ʔっ ✨ Usa ,menu o ,ayuda.";
  }

  guardar();
  return respuesta;
}

module.exports = { recibir };
