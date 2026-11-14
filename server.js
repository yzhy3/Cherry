require('dotenv').config();
const { 
  Client, 
  Collection, 
  GatewayIntentBits, 
  Partials, 
  EmbedBuilder, 
  ActivityType,
  REST,
  Routes,
  SlashCommandBuilder,
  AutoModerationRuleTriggerType,
  AutoModerationActionType,
  AutoModerationRuleEventType
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const keepAlive = require('./keep_alive.js');
const config = require('./config.json');

// ─── 1. Activar gafas VR verdes ──────────────────────────────────────────────
try {
  const { identifyProperties } = require('@discordjs/ws').DefaultWebSocketManagerOptions;
  identifyProperties.browser = 'Discord VR';
  identifyProperties.device = 'Discord VR';
} catch (e) {
  console.error('Error al configurar Discord VR:', e);
}

// ─── 2. Client Setup ─────────────────────────────────────────────────────────
const client = new Client({
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();
client.aliases  = new Collection();
client.prefix   = config.default_prefix;
client.color    = `#${config.COLOR}`;

// ─── 3. Load Handlers ────────────────────────────────────────────────────────
const handlersPath = path.join(__dirname, 'handlers');
if (fs.existsSync(handlersPath)) {
  fs.readdirSync(handlersPath).forEach(file => {
    if (file.endsWith('.js')) {
      const handler = require(`./handlers/${file}`);
      handler(client);
    }
  });
}

// ─── 4. Responder al comando /ping (para insignia de comandos) ───────────────
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply(`🏓 ¡Pong! Latencia: ${client.ws.ping}ms`);
  }
});

// ─── 5. Message Event (Tus comandos normales con prefijo) ────────────────────
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const prefix = client.prefix;
  if (!message.content.startsWith(prefix)) return;

  const args    = message.content.slice(prefix.length).trim().split(/ +/g);
  const cmdName = args.shift().toLowerCase();

  const command = client.commands.get(cmdName)
    || client.commands.get(client.aliases.get(cmdName));

  if (!command) return;

  try {
    command.run(client, message, args);
  } catch (err) {
    console.error(`[CHERRY] Command error in ${cmdName}:`, err);
    message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor('Red')
          .setDescription(`❌ An error occurred while running \`${cmdName}\`.`)
      ]
    });
  }
});

// ─── 6. Ready Event: Activar Insignias (Slash Commands + AutoMod) ────────────
client.once('clientReady', async () => {
  console.log(`\n🍒 CHERRY Bot is online!`);
  console.log(`   Logged in as: ${client.user.tag}`);
  console.log(`   Prefix: ${client.prefix}`);
  console.log(`   Servers: ${client.guilds.cache.size}\n`);

  client.user.setPresence({
    activities: [{
      name: `${client.prefix}help | 🍒 CHERRY`,
      type: ActivityType.Playing
    }],
    status: 'online'
  });

  // A) INSIGNIA: Compatible con comandos (/)
  const token = process.env.TOKEN || config.token;
  const rest = new REST({ version: '10' }).setToken(token);
  const commands = [
    new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Comprueba la velocidad del bot')
      .toJSON()
  ];

  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Comando /ping registrado (Insignia de comandos activada)');
  } catch (err) {
    console.error('❌ Error registrando comando /:', err);
  }

  // B) INSIGNIA: Usa AutoMod
  // Busca el primer servidor donde esté el bot para crear la regla si no existe
  const guild = client.guilds.cache.first();
  if (guild) {
    try {
      const existingRules = await guild.autoModerationRules.fetch();
      const hasRule = existingRules.some(rule => rule.creatorId === client.user.id);

      if (!hasRule) {
        await guild.autoModerationRules.create({
          name: 'Filtro AutoMod CHERRY',
          eventType: AutoModerationRuleEventType.MessageSend,
          triggerType: AutoModerationRuleTriggerType.Keyword,
          triggerMetadata: {
            keywordFilter: ['palabraprohibidaprueba999']
          },
          actions: [
            {
              type: AutoModerationActionType.BlockMessage,
              metadata: {
                customMessage: 'Mensaje bloqueado por AutoMod.'
              }
            }
          ],
          enabled: true
        });
        console.log(`✅ Regla de AutoMod creada en "${guild.name}" (Insignia de AutoMod activada)`);
      } else {
        console.log('ℹ️ El bot ya tiene una regla de AutoMod activa en este servidor.');
      }
    } catch (err) {
      console.error('❌ No se pudo crear la regla de AutoMod (asegúrate de que el bot tenga permiso de Administrador en el servidor):', err.message);
    }
  }
});

// ─── Error Handling ──────────────────────────────────────────────────────────
client.on('error', err => console.error('[CHERRY] Client error:', err));
process.on('unhandledRejection', err => console.error('[CHERRY] Unhandled rejection:', err));

// ─── Start ───────────────────────────────────────────────────────────────────
keepAlive();
client.login(process.env.TOKEN || config.token);
