import db from '../database/db.js';

export default {
    name: 'guildBanAdd',
    async execute(ban) {
        try {
            const config = db.getAvisoConfig(ban.guild.id, 'ban');
            if (!config || !config.enabled || !config.channelId) return;

            const channel = ban.guild.channels.cache.get(config.channelId);
            if (!channel) return;

            const user = ban.user;
            const text = (config.message || '🔨 **{user}** ha sido baneado del servidor.')
                .replace(/{user}/g, `<@${user.id}>`)
                .replace(/{username}/g, user.username || 'Usuario')
                .replace(/{server}/g, ban.guild.name)
                .replace(/{count}/g, ban.guild.memberCount);

            await channel.send({ content: text });
        } catch (err) {
            console.error('Error enviando aviso de ban:', err);
        }
    }
};
