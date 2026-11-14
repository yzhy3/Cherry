import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { getGuildSettings } from '../../database/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulsa a un usuario del servidor')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a expulsar').setRequired(true))
    .addStringOption(opt => opt.setName('razon').setDescription('Razón').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('usuario');
    const reason = interaction.options.getString('razon') || 'Sin razón especificada';

    if (!target) {
      return interaction.reply({ content: '❌ Usuario no encontrado en el servidor.', ephemeral: true });
    }
    if (!target.kickable) {
      return interaction.reply({ content: '❌ No puedo expulsar a ese usuario.', ephemeral: true });
    }

    await target.kick(`${interaction.user.tag}: ${reason}`);

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle('👢 Usuario expulsado')
      .addFields(
        { name: 'Usuario', value: `${target.user.tag} (${target.id})`, inline: true },
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
