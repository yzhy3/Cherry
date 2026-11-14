import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getLeaderboard } from '../../database/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Top 10 usuarios con más XP del servidor'),

  async execute(interaction) {
    const lb = getLeaderboard(interaction.guild.id, 10);

    if (lb.length === 0) {
      return interaction.reply({ content: '📭 Todavía no hay nadie en el ranking.', ephemeral: true });
    }

    const lines = await Promise.all(
      lb.map(async (entry, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`;
        let name = `Usuario desconocido`;
        try {
          const user = await interaction.client.users.fetch(entry.user_id);
          name = user.username;
        } catch {}
        return `${medal} **${name}** — Nivel **${entry.level}** (${entry.total_xp.toLocaleString()} XP)`;
      })
    );

    const embed = new EmbedBuilder()
      .setColor(0xff69b4)
      .setTitle(`🏆 Leaderboard — ${interaction.guild.name}`)
      .setDescription(lines.join('\n'))
      .setFooter({ text: 'Cherry Leveling' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
