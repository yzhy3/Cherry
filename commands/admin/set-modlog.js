import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { updateGuildSettings } from '../../database/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('set-modlog')
    .setDescription('Configura el canal de logs de moderación')
    .addChannelOption(opt =>
      opt.setName('canal')
        .setDescription('Canal de logs')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const channel = interaction.options.getChannel('canal');
    updateGuildSettings(interaction.guild.id, { modlog_channel_id: channel.id });

    await interaction.reply({
      content: `✅ Canal de mod-log configurado en ${channel}`,
      ephemeral: true,
    });
  },
};
