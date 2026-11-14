import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../data/cherry.db');

// Ensure data directory exists
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    prefix TEXT DEFAULT '!',
    welcome_channel_id TEXT,
    welcome_message TEXT DEFAULT 'Welcome {user} to {server}!',
    welcome_embed INTEGER DEFAULT 1,
    autorole_id TEXT,
    modlog_channel_id TEXT,
    leveling_enabled INTEGER DEFAULT 1,
    levelup_channel_id TEXT,
    levelup_message TEXT DEFAULT '🎉 {user} reached level **{level}**!',
    levelup_dm INTEGER DEFAULT 0,
    antimod_enabled INTEGER DEFAULT 1,
    anti_invite INTEGER DEFAULT 1,
    anti_spam INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_levels (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 0,
    total_xp INTEGER DEFAULT 0,
    last_xp_at INTEGER DEFAULT 0,
    PRIMARY KEY (guild_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS level_roles (
    guild_id TEXT NOT NULL,
    level INTEGER NOT NULL,
    role_id TEXT NOT NULL,
    PRIMARY KEY (guild_id, level)
  );

  CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS temp_voices (
    channel_id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS temp_voice_creators (
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    PRIMARY KEY (guild_id, channel_id)
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    message_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    event_time TEXT,
    creator_id TEXT NOT NULL,
    role_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS event_rsvps (
    event_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    status TEXT CHECK(status IN ('yes','no','maybe')),
    PRIMARY KEY (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS custom_commands (
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    response TEXT NOT NULL,
    PRIMARY KEY (guild_id, name)
  );

  CREATE INDEX IF NOT EXISTS idx_user_levels_guild ON user_levels(guild_id);
  CREATE INDEX IF NOT EXISTS idx_warnings_user ON warnings(guild_id, user_id);
`);

export default db;

// Helper functions
export function getGuildSettings(guildId) {
  let row = db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId);
  if (!row) {
    db.prepare('INSERT INTO guild_settings (guild_id) VALUES (?)').run(guildId);
    row = db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId);
  }
  return row;
}

export function updateGuildSettings(guildId, data) {
  const keys = Object.keys(data);
  if (keys.length === 0) return;
  const sets = keys.map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE guild_settings SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE guild_id = @guild_id`)
    .run({ ...data, guild_id: guildId });
}

export function getUserLevel(guildId, userId) {
  let row = db.prepare('SELECT * FROM user_levels WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
  if (!row) {
    db.prepare('INSERT INTO user_levels (guild_id, user_id) VALUES (?, ?)').run(guildId, userId);
    row = db.prepare('SELECT * FROM user_levels WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
  }
  return row;
}

export function addXP(guildId, userId, amount) {
  const user = getUserLevel(guildId, userId);
  const newTotal = user.total_xp + amount;
  const newLevel = Math.floor(0.1 * Math.sqrt(newTotal));
  const leveledUp = newLevel > user.level;

  db.prepare(`
    UPDATE user_levels 
    SET xp = ?, level = ?, total_xp = ?, last_xp_at = ?
    WHERE guild_id = ? AND user_id = ?
  `).run(
    newTotal - (newLevel * newLevel * 100), // remaining xp in current level
    newLevel,
    newTotal,
    Date.now(),
    guildId,
    userId
  );

  return { leveledUp, oldLevel: user.level, newLevel, totalXp: newTotal };
}

export function getLeaderboard(guildId, limit = 10) {
  return db.prepare(`
    SELECT user_id, level, total_xp, xp 
    FROM user_levels 
    WHERE guild_id = ? 
    ORDER BY total_xp DESC 
    LIMIT ?
  `).all(guildId, limit);
}

export function getLevelRoles(guildId) {
  return db.prepare('SELECT * FROM level_roles WHERE guild_id = ? ORDER BY level ASC').all(guildId);
}

export function setLevelRole(guildId, level, roleId) {
  db.prepare(`
    INSERT INTO level_roles (guild_id, level, role_id) VALUES (?, ?, ?)
    ON CONFLICT(guild_id, level) DO UPDATE SET role_id = excluded.role_id
  `).run(guildId, level, roleId);
}

export function addWarning(guildId, userId, moderatorId, reason) {
  const info = db.prepare(`
    INSERT INTO warnings (guild_id, user_id, moderator_id, reason) VALUES (?, ?, ?, ?)
  `).run(guildId, userId, moderatorId, reason || 'No reason provided');
  return info.lastInsertRowid;
}

export function getWarnings(guildId, userId) {
  return db.prepare('SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC').all(guildId, userId);
}

export function clearWarnings(guildId, userId) {
  return db.prepare('DELETE FROM warnings WHERE guild_id = ? AND user_id = ?').run(guildId, userId);
}
