import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { addWarning, getWarnings, getGuildSettings } from '../../database/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Advierte a un usuario')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a advertir').setRequired(true))
    .addStringOption(opt => opt.setName('razon').setDescription('Razón de la advertencia').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const reason = interaction.options.getString('razon') || 'Sin razón especificada';

    const id = addWarning(interaction.guild.id, target.id, interaction.user.id, reason);
    const warnings = getWarnings(interaction.guild.id, target.id);

    const embed = new EmbedBuilder()
      .setColor(0xffff00)
      .setTitle('⚠️ Advertencia emitida')
      .addFields(
        { name: 'Usuario', value: `${target.tag} (${target.id})`, inline: true },
        { name: 'Moderador', value: interaction.user.tag, inline: true },
        { name: 'Razón', value: reason },
        { name: 'Total de advertencias', value: `${warnings.length}` }
      )
      .setFooter({ text: `ID de advertencia: ${id}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // DM the user
    await target.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xffff00)
          .setTitle(`Has recibido una advertencia en ${interaction.guild.name}`)
          .setDescription(`**Razón:** ${reason}\n**Moderador:** ${interaction.user.tag}`)
          .setTimestamp(),
      ],
    }).catch(() => {});

    const settings = getGuildSettings(interaction.guild.id);
    if (settings.modlog_channel_id) {
      const logCh = interaction.guild.channels.cache.get(settings.modlog_channel_id);
      if (logCh) await logCh.send({ embeds: [embed] }).catch(() => {});
    }
  },
};
