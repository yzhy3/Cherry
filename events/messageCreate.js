import { getGuildSettings, addXP, getUserLevel, getLevelRoles } from '../database/db.js';
import { EmbedBuilder } from 'discord.js';

const XP_COOLDOWN = 60 * 1000; // 60 seconds
const XP_MIN = 15;
const XP_MAX = 25;

export default {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const settings = getGuildSettings(message.guild.id);

    // ===== LEVELING =====
    if (settings.leveling_enabled) {
      const user = getUserLevel(message.guild.id, message.author.id);
      const now = Date.now();

      if (now - user.last_xp_at >= XP_COOLDOWN) {
        const amount = Math.floor(Math.random() * (XP_MAX - XP_MIN + 1)) + XP_MIN;
        const result = addXP(message.guild.id, message.author.id, amount);

        if (result.leveledUp) {
          // Level role rewards
          const levelRoles = getLevelRoles(message.guild.id);
          const highest = levelRoles
            .filter(r => r.level <= result.newLevel)
            .sort((a, b) => b.level - a.level)[0];

          if (highest) {
            const role = message.guild.roles.cache.get(highest.role_id);
            if (role && role.editable) {
              // Remove lower level roles
              for (const lr of levelRoles) {
                if (lr.level < highest.level) {
                  const oldRole = message.guild.roles.cache.get(lr.role_id);
                  if (oldRole && message.member.roles.cache.has(oldRole.id)) {
                    await message.member.roles.remove(oldRole).catch(() => {});
                  }
                }
              }
              await message.member.roles.add(role).catch(() => {});
            }
          }

          // Level up message
          let msg = (settings.levelup_message || '🎉 {user} reached level **{level}**!')
            .replace(/{user}/g, `<@${message.author.id}>`)
            .replace(/{username}/g, message.author.username)
            .replace(/{level}/g, result.newLevel.toString());

          if (settings.levelup_dm) {
            await message.author.send(msg).catch(() => {});
          } else if (settings.levelup_channel_id) {
            const ch = message.guild.channels.cache.get(settings.levelup_channel_id);
            if (ch) await ch.send(msg).catch(() => {});
          } else {
            await message.channel.send(msg).catch(() => {});
          }
        }
      }
    }

    // ===== AUTOMOD (basic) =====
    if (settings.antimod_enabled) {
      // Anti-invite
      if (settings.anti_invite) {
        const inviteRegex = /(discord\.gg\/|discord\.com\/invite\/|discordapp\.com\/invite\/)[a-zA-Z0-9]+/gi;
        if (inviteRegex.test(message.content) && !message.member.permissions.has('ManageMessages')) {
          await message.delete().catch(() => {});
          const warn = await message.channel.send(`⚠️ <@${message.author.id}> No se permiten invitaciones de Discord aquí.`).catch(() => null);
          if (warn) setTimeout(() => warn.delete().catch(() => {}), 5000);

          // Log if modlog exists
          if (settings.modlog_channel_id) {
            const logCh = message.guild.channels.cache.get(settings.modlog_channel_id);
            if (logCh) {
              const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Anti-Invite Triggered')
                .addFields(
                  { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
                  { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
                  { name: 'Content', value: message.content.slice(0, 1000) || 'N/A' }
                )
                .setTimestamp();
              await logCh.send({ embeds: [embed] }).catch(() => {});
            }
          }
          return;
        }
      }
    }
  },
};
