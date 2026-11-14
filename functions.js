import { EmbedBuilder } from 'discord.js';
import config from './config.json' with { type: 'json' };

export function cherryEmbed() {
  return new EmbedBuilder()
    .setColor(config.color || 0xff69b4)
    .setFooter({ text: config.embedFooter || 'Cherry Bot 🍒' })
    .setTimestamp();
}

export function errorEmbed(text) {
  return cherryEmbed().setColor(0xff0000).setDescription(`❌ ${text}`);
}

export function successEmbed(text) {
  return cherryEmbed().setColor(0x22c55e).setDescription(`✅ ${text}`);
}

export function parsePlaceholders(text, { user, guild, memberCount, level } = {}) {
  if (!text) return text;
  return text
    .replace(/{user}/g, user ? `<@${user.id}>` : '')
    .replace(/{username}/g, user?.username || '')
    .replace(/{server}/g, guild?.name || '')
    .replace(/{membercount}/g, memberCount?.toString() || '')
    .replace(/{level}/g, level?.toString() || '');
}

export function isOwner(userId) {
  try {
    const owners = (process.env.OWNER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
    return owners.includes(userId);
  } catch {
    return false;
  }
}
