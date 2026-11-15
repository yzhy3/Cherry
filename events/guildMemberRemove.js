import db from '../database/db.js';

export default {
    name: 'guildMemberRemove',
    async execute(member) {
        try {
            const config = db.getAvisoConfig(member.guild.id, 'salida');
            if (!config || !config.enabled || !config.channelId) return;

            const channel = member.guild.channels.cache.get(config.channelId);
            if (!channel) return;

            const text = (config.message || '👋 **{user}** ha salido del servidor.')
                .replace(/{user}/g, `<@${member.id}>`)
                .replace(/{username}/g, member.user?.username || 'Usuario')
                .replace(/{server}/g, member.guild.name)
                .replace(/{count}/g, member.guild.memberCount);

            await channel.send({ content: text });
        } catch (err) {
            console.error('Error enviando aviso de salida:', err);
        }
    }
};
