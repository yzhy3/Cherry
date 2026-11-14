import { EmbedBuilder } from 'discord.js';
import { getGuildSettings } from '../database/db.js';

export default {
  name: 'guildMemberAdd',
  async execute(member, client) {
    try {
      const settings = getGuildSettings(member.guild.id);

      // AutoRole
      if (settings.autorole_id) {
        const role = member.guild.roles.cache.get(settings.autorole_id);
        if (role && role.editable) {
          await member.roles.add(role).catch(console.error);
        }
      }

      // Welcome message
      if (settings.welcome_channel_id) {
        const channel = member.guild.channels.cache.get(settings.welcome_channel_id);
        if (!channel) return;

        let message = (settings.welcome_message || 'Welcome {user} to {server}!')
          .replace(/{user}/g, `<@${member.id}>`)
          .replace(/{username}/g, member.user.username)
          .replace(/{server}/g, member.guild.name)
          .replace(/{membercount}/g, member.guild.memberCount.toString());

        if (settings.welcome_embed) {
          const embed = new EmbedBuilder()
            .setColor(0xff69b4) // Cherry pink
            .setTitle(`Welcome to ${member.guild.name}!`)
            .setDescription(message)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setFooter({ text: `Member #${member.guild.memberCount}` })
            .setTimestamp();

          await channel.send({ content: `<@${member.id}>`, embeds: [embed] }).catch(console.error);
        } else {
          await channel.send(message).catch(console.error);
        }
      }
    } catch (err) {
      console.error('guildMemberAdd error:', err);
    }
  },
};
