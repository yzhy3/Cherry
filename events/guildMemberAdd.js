const { AttachmentBuilder } = require('discord.js');
const { generateWelcomeCard } = require('../module/welcomeCard');
const db = require('../database/db');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        const config = await db.getWelcomeConfig(member.guild.id);
        if (!config || !config.enabled || !config.channelId) return;

        const channel = member.guild.channels.cache.get(config.channelId);
        if (!channel) return;

        try {
            const buffer = await generateWelcomeCard(member, config);
            const attachment = new AttachmentBuilder(buffer, { name: 'welcome.png' });

            const text = (config.message || '¡Bienvenido {user} a **{server}**!')
                .replace('{user}', `<@${member.id}>`)
                .replace('{server}', member.guild.name)
                .replace('{count}', member.guild.memberCount);

            await channel.send({ content: text, files: [attachment] });
        } catch (err) {
            console.error('Error enviando bienvenida:', err);
        }
    }
};
