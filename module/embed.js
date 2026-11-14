const { MessageEmbed } = require('discord.js');
const config = require('../config.json');

/**
 * Quick embed builder for CHERRY Bot
 * @param {string} type - 'success' | 'error' | 'info' | 'warn'
 * @param {string} description
 */
function quickEmbed(type, description) {
  const colors = {
    success: 'GREEN',
    error: 'RED',
    info: `#${config.COLOR}`,
    warn: 'YELLOW'
  };
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' };

  return new MessageEmbed()
    .setColor(colors[type] || `#${config.COLOR}`)
    .setDescription(`${icons[type] || ''} ${description}`)
    .setFooter('🍒 CHERRY Bot')
    .setTimestamp();
}

module.exports = { quickEmbed };
