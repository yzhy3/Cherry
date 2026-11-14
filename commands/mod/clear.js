import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Elimina mensajes del canal')
    .addIntegerOption(opt =>
      opt.setName('cantidad').setDescription('Cantidad de mensajes (1-100)').setRequired(true).setMinValue(1).setMaxValue(100)
    )
    .addUserOption(opt => opt.setName('usuario').setDescription('Solo mensajes de este usuario').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger('cantidad');
    const target = interaction.options.getUser('usuario');

    await interaction.deferReply({ ephemeral: true });

    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    let filtered = messages.filter(m => Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000); // 14 days

    if (target) {
      filtered = filtered.filter(m => m.author.id === target.id);
    }

    const toDelete = [...filtered.values()].slice(0, amount);
    const deleted = await interaction.channel.bulkDelete(toDelete, true);

    await interaction.editReply(`🗑️ Se eliminaron **${deleted.size}** mensajes.`);
  },
};
