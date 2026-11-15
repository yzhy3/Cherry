import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../data');
const dbPath = path.join(dataDir, 'cherry.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function load() {
  if (!fs.existsSync(dbPath)) {
    const initial = {
      guild_settings: {},
      welcome_configs: {},
      avisos_configs: {},
      user_levels: {},
      level_roles: {},
      warnings: {},
      temp_voices: {},
      temp_voice_creators: {}
    };
    fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    if (!data.welcome_configs) data.welcome_configs = {};
    if (!data.avisos_configs) data.avisos_configs = {};
    return data;
  } catch {
    return {
      guild_settings: {},
      welcome_configs: {},
      avisos_configs: {},
      user_levels: {},
      level_roles: {},
      warnings: {},
      temp_voices: {},
      temp_voice_creators: {}
    };
  }
}

function save(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

let db = load();
let dirty = false;

setInterval(() => {
  if (dirty) {
    save(db);
    dirty = false;
  }
}, 5000);

function markDirty() {
  dirty = true;
}

// ===== BIENVENIDA (compatibilidad) =====
export function getWelcomeConfig(guildId) {
  return db.welcome_configs[guildId] || null;
}

export function saveWelcomeConfig(guildId, config) {
  db.welcome_configs[guildId] = config;
  markDirty();
  return true;
}

// ===== AVISOS (Entrada / Salida / Ban / Boost) =====
const DEFAULT_AVISO = {
  enabled: false,
  channelId: '',
  message: '',
};

const DEFAULT_ENTRADA = {
  enabled: false,
  channelId: '',
  message: '¡Hola {user}, bienvenido/a a **{server}**!',
  cardTitle: '¡BIENVENIDO!',
  cardSubtitle: 'Eres el miembro #{count} en {server}',
  bgImage: '',
  bgColor: '#1e1f22',
  borderColor: '#ff5c8a',
  titleColor: '#ffffff',
  usernameColor: '#ff5c8a',
  subtitleColor: '#d1d5db',
  overlayOpacity: 0.55,
};

export function getAvisosConfig(guildId) {
  if (!db.avisos_configs[guildId]) {
    // Migrar welcome_configs si existe
    const oldWelcome = db.welcome_configs[guildId];
    db.avisos_configs[guildId] = {
      entrada: oldWelcome ? { ...DEFAULT_ENTRADA, ...oldWelcome } : { ...DEFAULT_ENTRADA },
      salida: {
        ...DEFAULT_AVISO,
        message: '👋 **{user}** ha salido del servidor.',
      },
      ban: {
        ...DEFAULT_AVISO,
        message: '🔨 **{user}** ha sido baneado del servidor.',
      },
      boost: {
        ...DEFAULT_AVISO,
        message: '🚀 ¡**{user}** ha impulsado el servidor! ¡Gracias por el boost!',
      },
    };
    markDirty();
  }
  return db.avisos_configs[guildId];
}

export function saveAvisosConfig(guildId, config) {
  db.avisos_configs[guildId] = config;
  // Mantener sincronizado welcome_configs para compatibilidad
  if (config.entrada) {
    db.welcome_configs[guildId] = config.entrada;
  }
  markDirty();
  return true;
}

export function getAvisoConfig(guildId, type) {
  const avisos = getAvisosConfig(guildId);
  return avisos[type] || null;
}

export function saveAvisoConfig(guildId, type, config) {
  const avisos = getAvisosConfig(guildId);
  avisos[type] = config;
  if (type === 'entrada') {
    db.welcome_configs[guildId] = config;
  }
  markDirty();
  return true;
}

// ===== RESTO =====
export function getGuildSettings(guildId) {
  if (!db.guild_settings[guildId]) {
    db.guild_settings[guildId] = {
      guild_id: guildId,
      prefix: '!',
      welcome_channel_id: null,
      welcome_message: '¡Bienvenido {user} a {server}!',
      welcome_embed: 1,
      autorole_id: null,
      modlog_channel_id: null,
      leveling_enabled: 1,
      levelup_channel_id: null,
      levelup_message: '🎉 {user} subió al nivel **{level}**!',
      levelup_dm: 0,
      antimod_enabled: 1,
      anti_invite: 1,
      anti_spam: 1
    };
    markDirty();
  }
  return db.guild_settings[guildId];
}

export function updateGuildSettings(guildId, data) {
  const current = getGuildSettings(guildId);
  db.guild_settings[guildId] = { ...current, ...data };
  markDirty();
}

function levelKey(guildId, userId) {
  return `${guildId}:${userId}`;
}

export function getUserLevel(guildId, userId) {
  const key = levelKey(guildId, userId);
  if (!db.user_levels[key]) {
    db.user_levels[key] = {
      guild_id: guildId,
      user_id: userId,
      xp: 0,
      level: 0,
      total_xp: 0,
      last_xp_at: 0
    };
    markDirty();
  }
  return db.user_levels[key];
}

export function addXP(guildId, userId, amount) {
  const user = getUserLevel(guildId, userId);
  const oldLevel = user.level;
  const newTotal = user.total_xp + amount;
  const newLevel = Math.floor(0.1 * Math.sqrt(newTotal));
  const leveledUp = newLevel > oldLevel;

  user.total_xp = newTotal;
  user.level = newLevel;
  user.xp = newTotal - (newLevel * newLevel * 100);
  user.last_xp_at = Date.now();
  markDirty();

  return { leveledUp, oldLevel, newLevel, totalXp: newTotal };
}

export function getLeaderboard(guildId, limit = 10) {
  return Object.values(db.user_levels)
    .filter(u => u.guild_id === guildId)
    .sort((a, b) => b.total_xp - a.total_xp)
    .slice(0, limit);
}

export function getLevelRoles(guildId) {
  if (!db.level_roles[guildId]) db.level_roles[guildId] = [];
  return db.level_roles[guildId].sort((a, b) => a.level - b.level);
}

export function setLevelRole(guildId, level, roleId) {
  if (!db.level_roles[guildId]) db.level_roles[guildId] = [];
  const existing = db.level_roles[guildId].find(r => r.level === level);
  if (existing) {
    existing.role_id = roleId;
  } else {
    db.level_roles[guildId].push({ guild_id: guildId, level, role_id: roleId });
  }
  markDirty();
}

export function addWarning(guildId, userId, moderatorId, reason) {
  const key = `${guildId}:${userId}`;
  if (!db.warnings[key]) db.warnings[key] = [];
  const id = Date.now();
  db.warnings[key].push({
    id,
    guild_id: guildId,
    user_id: userId,
    moderator_id: moderatorId,
    reason: reason || 'Sin razón',
    created_at: new Date().toISOString()
  });
  markDirty();
  return id;
}

export function getWarnings(guildId, userId) {
  const key = `${guildId}:${userId}`;
  return db.warnings[key] || [];
}

export function clearWarnings(guildId, userId) {
  const key = `${guildId}:${userId}`;
  db.warnings[key] = [];
  markDirty();
}

export function getTempVoiceCreators(guildId) {
  return db.temp_voice_creators[guildId] || [];
}

export function setTempVoiceCreators(guildId, channelIds) {
  db.temp_voice_creators[guildId] = channelIds || [];
  markDirty();
}

export function addTempVoice(channelId, guildId, ownerId) {
  db.temp_voices[channelId] = { channel_id: channelId, guild_id: guildId, owner_id: ownerId };
  markDirty();
}

export function getTempVoice(channelId) {
  return db.temp_voices[channelId] || null;
}

export function removeTempVoice(channelId) {
  delete db.temp_voices[channelId];
  markDirty();
}

export default {
  getWelcomeConfig,
  saveWelcomeConfig,
  getAvisosConfig,
  saveAvisosConfig,
  getAvisoConfig,
  saveAvisoConfig,
  getGuildSettings,
  updateGuildSettings,
  getUserLevel,
  addXP,
  getLeaderboard,
  getLevelRoles,
  setLevelRole,
  addWarning,
  getWarnings,
  clearWarnings,
  getTempVoiceCreators,
  setTempVoiceCreators,
  addTempVoice,
  getTempVoice,
  removeTempVoice
};
