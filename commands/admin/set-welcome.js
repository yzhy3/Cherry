import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { updateGuildSettings, getGuildSettings } from '../../database/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('set-welcome')
    .setDescription('Configura el canal y mensaje de bienvenida')
    .addChannelOption(opt =>
      opt.setName('canal')
        .setDescription('Canal de bienvenida')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('mensaje')
        .setDescription('Mensaje (usa {user}, {server}, {membercount})')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const channel = interaction.options.getChannel('canal');
    const message = interaction.options.getString('mensaje');

    const data = { welcome_channel_id: channel.id };
    if (message) data.welcome_message = message;

    updateGuildSettings(interaction.guild.id, data);

    await interaction.reply({
      content: `✅ Canal de bienvenida configurado en ${channel}.${message ? `\nMensaje: ${message}` : ''}`,
      ephemeral: true,
    });
  },
};
