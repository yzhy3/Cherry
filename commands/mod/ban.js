import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { getGuildSettings } from '../../database/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Banea a un usuario del servidor')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a banear').setRequired(true))
    .addStringOption(opt => opt.setName('razon').setDescription('Razón del baneo').setRequired(false))
    .addIntegerOption(opt =>
      opt.setName('dias').setDescription('Días de mensajes a eliminar (0-7)').setMinValue(0).setMaxValue(7)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const reason = interaction.options.getString('razon') || 'Sin razón especificada';
    const days = interaction.options.getInteger('dias') ?? 0;

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: '❌ No puedes banearte a ti mismo.', ephemeral: true });
    }

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (member && !member.bannable) {
      return interaction.reply({ content: '❌ No puedo banear a ese usuario (jerarquía o permisos).', ephemeral: true });
    }

    await interaction.guild.members.ban(target.id, { deleteMessageSeconds: days * 24 * 60 * 60, reason: `${interaction.user.tag}: ${reason}` });

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('🔨 Usuario baneado')
      .addFields(
        { name: 'Usuario', value: `${target.tag} (${target.id})`, inline: true },
        { name: 'Moderador', value: `${interaction.user.tag}`, inline: true },
        { name: 'Razón', value: reason }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Modlog
    const settings = getGuildSettings(interaction.guild.id);
    if (settings.modlog_channel_id) {
      const logCh = interaction.guild.channels.cache.get(settings.modlog_channel_id);
      if (logCh) await logCh.send({ embeds: [embed] }).catch(() => {});
    }
  },
};
