import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { updateGuildSettings } from '../../database/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('set-autorole')
    .setDescription('Configura el rol automático al unirse')
    .addRoleOption(opt =>
      opt.setName('rol').setDescription('Rol a asignar automáticamente').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const role = interaction.options.getRole('rol');

    if (role.managed || role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({
        content: '❌ No puedo asignar ese rol (está por encima de mí o es gestionado).',
        ephemeral: true,
      });
    }

    updateGuildSettings(interaction.guild.id, { autorole_id: role.id });

    await interaction.reply({
      content: `✅ AutoRole configurado: ${role}`,
      ephemeral: true,
    });
  },
};
