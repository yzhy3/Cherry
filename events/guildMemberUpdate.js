import db from '../database/db.js';

export default {
    name: 'guildMemberUpdate',
    async execute(oldMember, newMember) {
        try {
            // Detectar boost nuevo
            const wasBoosting = !!oldMember.premiumSince;
            const isBoosting = !!newMember.premiumSince;

            if (!wasBoosting && isBoosting) {
                const config = db.getAvisoConfig(newMember.guild.id, 'boost');
                if (!config || !config.enabled || !config.channelId) return;

                const channel = newMember.guild.channels.cache.get(config.channelId);
                if (!channel) return;

                const text = (config.message || '🚀 ¡**{user}** ha impulsado el servidor! ¡Gracias por el boost!')
                    .replace(/{user}/g, `<@${newMember.id}>`)
                    .replace(/{username}/g, newMember.user.username)
                    .replace(/{server}/g, newMember.guild.name)
                    .replace(/{count}/g, newMember.guild.memberCount);

                await channel.send({ content: text });
            }
        } catch (err) {
            console.error('Error enviando aviso de boost:', err);
        }
    }
};
