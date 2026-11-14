const { MessageEmbed } = require('discord.js');
const config = require('./config.json');

/**
 * Creates a standard CHERRY embed
 */
function cherryEmbed(title, description, color) {
  return new MessageEmbed()
    .setTitle(title || '')
    .setDescription(description || '')
    .setColor(color || `#${config.COLOR}`)
    .setFooter('🍒 CHERRY Bot', '')
    .setTimestamp();
}

/**
 * Formats milliseconds into human-readable duration
 */
function formatDuration(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  return [
    hours > 0 ? `${hours}h` : null,
    minutes > 0 ? `${minutes}m` : null,
    `${seconds}s`
  ].filter(Boolean).join(' ');
}

/**
 * Checks if a user is an owner
 */
function isOwner(id) {
  const { owners } = require('./owner.json');
  return owners.includes(id);
}

/**
 * Capitalizes first letter of a string
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = { cherryEmbed, formatDuration, isOwner, capitalize };
