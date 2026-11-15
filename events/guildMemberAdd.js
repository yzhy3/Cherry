import { AttachmentBuilder } from 'discord.js';
import { generateWelcomeCard } from '../module/welcomeCard.js';
import db from '../database/db.js';

export default {
    name: 'guildMemberAdd',
    async execute(member) {
        try {
            const config = db.getAvisoConfig(member.guild.id, 'entrada');
            if (!config || !config.enabled || !config.channelId) return;

            const channel = member.guild.channels.cache.get(config.channelId);
            if (!channel) return;

            const buffer = await generateWelcomeCard(member, config);
            const attachment = new AttachmentBuilder(buffer, { name: 'welcome.png' });

            const text = (config.message || '¡Bienvenido {user} a **{server}**!')
                .replace(/{user}/g, `<@${member.id}>`)
                .replace(/{username}/g, member.user.username)
                .replace(/{server}/g, member.guild.name)
                .replace(/{count}/g, member.guild.memberCount);

            await channel.send({ content: text, files: [attachment] });
        } catch (err) {
            console.error('Error enviando bienvenida:', err);
        }
    }
};
