import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Muestra la ayuda de Cherry'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0xff69b4)
      .setTitle('🍒 Cherry — Ayuda')
      .setDescription('Bot multipropósito inspirado en MEE6.\nUsa el **Dashboard** para configurar la mayoría de opciones.')
      .addFields(
        {
          name: '📊 Leveling',
          value: '`/rank` `/leaderboard` `/set-levelrole`',
          inline: false,
        },
        {
          name: '🛡️ Moderación',
          value: '`/ban` `/kick` `/timeout` `/warn` `/clear`',
          inline: false,
        },
        {
          name: '⚙️ Administración',
          value: '`/set-welcome` `/set-autorole` `/set-modlog`',
          inline: false,
        },
        {
          name: '🔊 TempVoice',
          value: 'Configura canales creadores desde el Dashboard. Al unirte se crea un canal temporal tuyo.',
          inline: false,
        },
        {
          name: '🌐 Dashboard',
          value: process.env.DASHBOARD_URL
            ? `[Abrir Dashboard](${process.env.DASHBOARD_URL})`
            : 'Configura `DASHBOARD_URL` en el .env',
          inline: false,
        }
      )
      .setFooter({ text: 'Cherry Bot • Node.js Edition' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
