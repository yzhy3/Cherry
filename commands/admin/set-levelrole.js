import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { setLevelRole } from '../../database/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('set-levelrole')
    .setDescription('Asigna un rol de recompensa por nivel')
    .addIntegerOption(opt =>
      opt.setName('nivel').setDescription('Nivel requerido').setRequired(true).setMinValue(1)
    )
    .addRoleOption(opt =>
      opt.setName('rol').setDescription('Rol a dar').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const level = interaction.options.getInteger('nivel');
    const role = interaction.options.getRole('rol');

    setLevelRole(interaction.guild.id, level, role.id);

    await interaction.reply({
      content: `✅ Al alcanzar el **nivel ${level}** se otorgará el rol ${role}`,
      ephemeral: true,
    });
  },
};
