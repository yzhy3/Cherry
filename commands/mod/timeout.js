import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { getGuildSettings } from '../../database/db.js';
import ms from 'ms';

export default {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Aplica timeout a un usuario')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario').setRequired(true))
    .addStringOption(opt =>
      opt.setName('duracion')
        .setDescription('Duración (ej: 10m, 1h, 1d)')
        .setRequired(true)
    )
    .addStringOption(opt => opt.setName('razon').setDescription('Razón').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('usuario');
    const durationStr = interaction.options.getString('duracion');
    const reason = interaction.options.getString('razon') || 'Sin razón';

    if (!target) {
      return interaction.reply({ content: '❌ Usuario no encontrado.', ephemeral: true });
    }
    if (!target.moderatable) {
      return interaction.reply({ content: '❌ No puedo aplicar timeout a ese usuario.', ephemeral: true });
    }

    const duration = ms(durationStr);
    if (!duration || duration < 1000 || duration > 28 * 24 * 60 * 60 * 1000) {
      return interaction.reply({ content: '❌ Duración inválida. Usa formatos como `10m`, `1h`, `1d` (máx 28 días).', ephemeral: true });
    }

    await target.timeout(duration, `${interaction.user.tag}: ${reason}`);

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('⏳ Timeout aplicado')
      .addFields(
        { name: 'Usuario', value: `${target.user.tag}`, inline: true },
        { name: 'Duración', value: durationStr, inline: true },
        { name: 'Moderador', value: interaction.user.tag, inline: true },
        { name: 'Razón', value: reason }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const settings = getGuildSettings(interaction.guild.id);
    if (settings.modlog_channel_id) {
      const logCh = interaction.guild.channels.cache.get(settings.modlog_channel_id);
      if (logCh) await logCh.send({ embeds: [embed] }).catch(() => {});
    }
  },
};
