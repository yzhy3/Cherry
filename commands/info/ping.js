const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'ping',
  aliases: ['latency'],
  category: 'info',
  description: 'Shows the bot\'s latency.',
  usage: '!ping',

  run: async (client, message, args) => {
    const msg = await message.channel.send('🍒 Pinging...');
    msg.edit(
      new MessageEmbed()
        .setColor(client.color)
        .setTitle('🍒 Pong!')
        .addField('Bot Latency', `\`${Math.round(msg.createdTimestamp - message.createdTimestamp)}ms\``, true)
        .addField('API Latency', `\`${Math.round(client.ws.ping)}ms\``, true)
    );
  }
};
