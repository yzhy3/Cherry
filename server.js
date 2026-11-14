import {
  Client,
  GatewayIntentBits,
  Collection,
  Partials,
  ActivityType,
  REST,
  Routes,
  SlashCommandBuilder,
  AutoModerationRuleTriggerType,
  AutoModerationActionType,
  AutoModerationRuleEventType,
} from 'discord.js';
import { DefaultWebSocketManagerOptions } from '@discordjs/ws';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { startApiServer } from './api/server.js';

config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ===== Gafas VR Verdes =====
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
if (fs.existsSync(eventsPath)) {
  for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
    const event = await import(`file://${path.join(eventsPath, file)}`);
    if (event.default?.once) {
      client.once(event.default.name, (...args) => event.default.execute(...args, client));
    } else if (event.default?.name) {
      client.on(event.default.name, (...args) => event.default.execute(...args, client));
    }
    console.log(`✅ Evento: ${event.default?.name || file}`);
  }
}

// ===== Responder al comando /ping (si no lo tienes en tu carpeta de comandos) =====
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === 'ping' && !client.commands.has('ping')) {
    await interaction.reply(`🏓 ¡Pong! Latencia: ${client.ws.ping}ms`);
  }
});

// ===== Evento Ready: Insignias (Comandos + AutoMod) y API =====
client.once('clientReady', async () => {
  console.log(`\n🍒 Cherry online como ${client.user.tag}`);
  console.log(`📊 En ${client.guilds.cache.size} servidores`);
  client.user.setActivity('Cherry | /help', { type: ActivityType.Watching });

  // 1. INSIGNIA: Compatible con comandos (/)
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const commands = [
      new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Comprueba la latencia del bot')
        .toJSON(),
    ];
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Comando /ping registrado (Insignia de comandos)');
  } catch (err) {
    console.error('❌ Error registrando comando /:', err.message);
  }

  // 2. INSIGNIA: Usa AutoMod
  const guild = client.guilds.cache.first();
  if (guild) {
    try {
      const existingRules = await guild.autoModerationRules.fetch();
      const hasRule = existingRules.some(rule => rule.creatorId === client.user.id);

      if (!hasRule) {
        await guild.autoModerationRules.create({
          name: 'Filtro AutoMod Cherry',
          eventType: AutoModerationRuleEventType.MessageSend,
          triggerType: AutoModerationRuleTriggerType.Keyword,
          triggerMetadata: {
            keywordFilter: ['palabraprohibidaprueba999'],
          },
          actions: [
            {
              type: AutoModerationActionType.BlockMessage,
              metadata: {
                customMessage: 'Mensaje bloqueado por AutoMod.',
              },
            },
          ],
          enabled: true,
        });
        console.log(`✅ Regla de AutoMod creada en "${guild.name}" (Insignia AutoMod)`);
      } else {
        console.log(`ℹ️ Cherry ya tiene una regla de AutoMod activa en "${guild.name}".`);
      }
    } catch (err) {
      console.error('❌ Error creando regla de AutoMod (verifica permisos de Administrador):', err.message);
    }
  }

  // 3. API interna (para el dashboard)
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
