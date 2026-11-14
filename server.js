import { Client, GatewayIntentBits, Collection, Partials, ActivityType } from 'discord.js';
import { DefaultWebSocketManagerOptions } from '@discordjs/ws';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { startApiServer } from './api/server.js';

config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ===== Configurar Discord VR (Versión 14.14.0) =====
try {
  DefaultWebSocketManagerOptions.identifyProperties.browser = 'Discord VR';
  DefaultWebSocketManagerOptions.identifyProperties.device = 'Discord VR';
} catch (e) {
  console.log('No se pudo aplicar Discord VR:', e);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

client.commands = new Collection();
client.cooldowns = new Collection();

// ===== Cargar handlers =====
const handlersPath = path.join(__dirname, 'handlers');
if (fs.existsSync(handlersPath)) {
  for (const file of fs.readdirSync(handlersPath).filter(f => f.endsWith('.js'))) {
    const handler = await import(`file://${path.join(handlersPath, file)}`);
    if (handler.default) await handler.default(client);
  }
}

// ===== Cargar events =====
const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
  const event = await import(`file://${path.join(eventsPath, file)}`);
  if (event.default?.once) {
    client.once(event.default.name, (...args) => event.default.execute(...args, client));
  } else if (event.default?.name) {
    client.on(event.default.name, (...args) => event.default.execute(...args, client));
  }
  console.log(`✅ Evento: ${event.default?.name || file}`);
}

client.once('clientReady', () => {
  console.log(`\n🍒 Cherry online como ${client.user.tag}`);
  console.log(`📊 En ${client.guilds.cache.size} servidores`);
  client.user.setActivity('Cherry | /help', { type: ActivityType.Watching });
  
  // API interna (para el dashboard)
  try {
    startApiServer(client);
  } catch (err) {
    console.log('⚠️ API interna no iniciada:', err.message);
  }
});

client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('❌ Error al iniciar sesión:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
