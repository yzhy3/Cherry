import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Muestra la latencia del bot'),

  async execute(interaction) {
    const sent = await interaction.reply({ content: '🏓 Pinging...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const api = Math.round(interaction.client.ws.ping);

    await interaction.editReply(`🏓 Pong!\n📡 Latencia: **${latency}ms**\n💓 API: **${api}ms**`);
  },
};
