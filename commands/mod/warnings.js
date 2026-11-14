import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { getWarnings, clearWarnings } from '../../database/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Ver o limpiar advertencias de un usuario')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario').setRequired(true))
    .addBooleanOption(opt =>
      opt.setName('limpiar').setDescription('Eliminar todas las advertencias').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const clear = interaction.options.getBoolean('limpiar');

    if (clear) {
      clearWarnings(interaction.guild.id, target.id);
      return interaction.reply({
        content: `✅ Se eliminaron todas las advertencias de **${target.tag}**.`,
        ephemeral: true,
      });
    }

    const warnings = getWarnings(interaction.guild.id, target.id);

    if (warnings.length === 0) {
      return interaction.reply({
        content: `📭 **${target.tag}** no tiene advertencias.`,
        ephemeral: true,
      });
    }

    const list = warnings
      .slice(0, 10)
      .map((w, i) => `**${i + 1}.** ${w.reason || 'Sin razón'} — <t:${Math.floor(new Date(w.created_at).getTime() / 1000)}:R>`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(0xffff00)
      .setTitle(`Advertencias de ${target.tag}`)
      .setDescription(list)
      .setFooter({ text: `Total: ${warnings.length}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
