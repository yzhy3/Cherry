import express from 'express';
import db from '../database/db.js';
import { generateWelcomeCard } from '../module/welcomeCard.js';
import { AttachmentBuilder } from 'discord.js';

export function startApiServer(client) {
    const app = express();
    
    // Inicializar middleware para leer JSON enviado desde el panel web
    app.use(express.json());

    // 1. Obtener configuración de bienvenida + lista de canales del servidor
    app.get('/api/guilds/:guildId/welcome', async (req, res) => {
        try {
            const { guildId } = req.params;
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return res.status(404).json({ error: 'Servidor no encontrado' });

            const channels = guild.channels.cache
                .filter(c => c.type === 0) // Canales de texto
                .map(c => ({ id: c.id, name: c.name }));

            const config = await db.getWelcomeConfig(guildId) || {
                enabled: false,
                channelId: channels[0]?.id || '',
                message: '¡Hola {user}, bienvenido/a a **{server}**!',
                cardTitle: '¡BIENVENIDO!',
                cardSubtitle: 'Eres el miembro #{count} en {server}',
                bgImage: '',
                bgColor: '#1e1f22',
                borderColor: '#ff5c8a',
                titleColor: '#ffffff',
                usernameColor: '#ff5c8a',
                subtitleColor: '#d1d5db',
                overlayOpacity: 0.55
            };

            res.json({ config, channels, guildName: guild.name, memberCount: guild.memberCount });
        } catch (err) {
            console.error('Error en GET welcome:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // 2. Guardar configuración desde el Dashboard
    app.post('/api/guilds/:guildId/welcome', async (req, res) => {
        try {
            const { guildId } = req.params;
            await db.saveWelcomeConfig(guildId, req.body);
            res.json({ success: true });
        } catch (err) {
            console.error('Error en POST welcome:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // 3. Botón "Probar Bienvenida" desde el Dashboard
    app.post('/api/guilds/:guildId/welcome/test', async (req, res) => {
        try {
            const { guildId } = req.params;
            const { userId, config } = req.body;
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return res.status(404).json({ error: 'Servidor no encontrado' });

            const member = await guild.members.fetch(userId).catch(() => null);
            const channel = guild.channels.cache.get(config.channelId);
            if (!member || !channel) return res.status(400).json({ error: 'Canal o usuario inválido' });

            const buffer = await generateWelcomeCard(member, config);
            const attachment = new AttachmentBuilder(buffer, { name: 'welcome.png' });
            
            const text = (config.message || '')
                .replace('{user}', `<@${member.id}>`)
                .replace('{server}', guild.name)
                .replace('{count}', guild.memberCount);

            await channel.send({ content: text, files: [attachment] });
            res.json({ success: true });
        } catch (err) {
            console.error('Error en TEST welcome:', err);
            res.status(500).json({ error: err.message });
        }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🌐 API escuchando en el puerto ${PORT}`);
    });
}
