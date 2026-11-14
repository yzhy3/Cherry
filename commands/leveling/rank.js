import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { getUserLevel, getLeaderboard } from '../../database/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Muestra tu nivel o el de otro usuario')
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuario a consultar').setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const data = getUserLevel(interaction.guild.id, target.id);

    // Simple progress calculation
    const currentLevelXp = data.level * data.level * 100;
    const nextLevelXp = (data.level + 1) * (data.level + 1) * 100;
    const progress = data.total_xp - currentLevelXp;
    const needed = nextLevelXp - currentLevelXp;
    const percent = Math.min(100, Math.floor((progress / needed) * 100));

    const barLength = 20;
    const filled = Math.round((percent / 100) * barLength);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

    // Position in leaderboard
    const lb = getLeaderboard(interaction.guild.id, 1000);
    const position = lb.findIndex(u => u.user_id === target.id) + 1 || '—';

    const embed = new EmbedBuilder()
      .setColor(0xff69b4)
      .setAuthor({
        name: `${target.username}'s Rank`,
        iconURL: target.displayAvatarURL({ dynamic: true }),
      })
      .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: 'Nivel', value: `**${data.level}**`, inline: true },
        { name: 'XP Total', value: `**${data.total_xp.toLocaleString()}**`, inline: true },
        { name: 'Posición', value: `**#${position}**`, inline: true },
        { name: 'Progreso', value: `\`${bar}\` ${percent}%\n${progress} / ${needed} XP` }
      )
      .setFooter({ text: 'Cherry Leveling System' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
