import express from 'express';
import db from '../database/db.js';
import { generateWelcomeCard } from '../module/welcomeCard.js';
import { AttachmentBuilder } from 'discord.js';

export function startApiServer(client) {
    const app = express();
    
    app.use(express.json({ limit: '10mb' }));

    // Helper: obtener canales de texto
    function getTextChannels(guild) {
        return guild.channels.cache
            .filter(c => c.type === 0)
            .map(c => ({ id: c.id, name: c.name }));
    }

    // ===== BIENVENIDA (compatibilidad) =====
    app.get('/api/guilds/:guildId/welcome', async (req, res) => {
        try {
            const { guildId } = req.params;
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return res.status(404).json({ error: 'Servidor no encontrado' });

            const channels = getTextChannels(guild);
            const avisos = db.getAvisosConfig(guildId);
            const config = avisos.entrada || {
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

            res.json({ config, channels, guildName: guild.name, memberCount: guild.memberCount, guildIcon: guild.icon });
        } catch (err) {
            console.error('Error en GET welcome:', err);
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/guilds/:guildId/welcome', async (req, res) => {
        try {
            const { guildId } = req.params;
            db.saveAvisoConfig(guildId, 'entrada', req.body);
            res.json({ success: true });
        } catch (err) {
            console.error('Error en POST welcome:', err);
            res.status(500).json({ error: err.message });
        }
    });

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
                .replace(/{user}/g, `<@${member.id}>`)
                .replace(/{server}/g, guild.name)
                .replace(/{count}/g, guild.memberCount);

            await channel.send({ content: text, files: [attachment] });
            res.json({ success: true });
        } catch (err) {
            console.error('Error en TEST welcome:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // ===== AVISOS COMPLETOS =====
    // GET todos los avisos + canales
    app.get('/api/guilds/:guildId/avisos', async (req, res) => {
        try {
            const { guildId } = req.params;
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return res.status(404).json({ error: 'Servidor no encontrado' });

            const channels = getTextChannels(guild);
            const config = db.getAvisosConfig(guildId);

            res.json({
                config,
                channels,
                guildName: guild.name,
                memberCount: guild.memberCount,
                guildIcon: guild.icon
            });
        } catch (err) {
            console.error('Error en GET avisos:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // GET un tipo específico
    app.get('/api/guilds/:guildId/avisos/:type', async (req, res) => {
        try {
            const { guildId, type } = req.params;
            if (!['entrada', 'salida', 'ban', 'boost'].includes(type)) {
                return res.status(400).json({ error: 'Tipo inválido' });
            }
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return res.status(404).json({ error: 'Servidor no encontrado' });

            const channels = getTextChannels(guild);
            const config = db.getAvisoConfig(guildId, type);

            res.json({
                config,
                channels,
                guildName: guild.name,
                memberCount: guild.memberCount,
                guildIcon: guild.icon
            });
        } catch (err) {
            console.error('Error en GET aviso:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // POST guardar un tipo
    app.post('/api/guilds/:guildId/avisos/:type', async (req, res) => {
        try {
            const { guildId, type } = req.params;
            if (!['entrada', 'salida', 'ban', 'boost'].includes(type)) {
                return res.status(400).json({ error: 'Tipo inválido' });
            }
            db.saveAvisoConfig(guildId, type, req.body);
            res.json({ success: true });
        } catch (err) {
            console.error('Error en POST aviso:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // POST test para un tipo (solo mensaje, sin card excepto entrada)
    app.post('/api/guilds/:guildId/avisos/:type/test', async (req, res) => {
        try {
            const { guildId, type } = req.params;
            const { userId, config } = req.body;
            if (!['entrada', 'salida', 'ban', 'boost'].includes(type)) {
                return res.status(400).json({ error: 'Tipo inválido' });
            }

            const guild = client.guilds.cache.get(guildId);
            if (!guild) return res.status(404).json({ error: 'Servidor no encontrado' });

            const member = await guild.members.fetch(userId).catch(() => null);
            const channel = guild.channels.cache.get(config.channelId);
            if (!member || !channel) return res.status(400).json({ error: 'Canal o usuario inválido' });

            let content = (config.message || '')
                .replace(/{user}/g, `<@${member.id}>`)
                .replace(/{username}/g, member.user.username)
                .replace(/{server}/g, guild.name)
                .replace(/{count}/g, guild.memberCount);

            if (type === 'entrada') {
                const buffer = await generateWelcomeCard(member, config);
                const attachment = new AttachmentBuilder(buffer, { name: 'welcome.png' });
                await channel.send({ content, files: [attachment] });
            } else {
                await channel.send({ content });
            }

            res.json({ success: true });
        } catch (err) {
            console.error('Error en TEST aviso:', err);
            res.status(500).json({ error: err.message });
        }
    });

    

    // Info del bot (avatar, nombre, id) para el panel
    app.get("/api/bot", async (req, res) => {
        try {
            if (!client.user) return res.status(503).json({ error: "Bot no listo" });
            const u = client.user;
            const avatar = u.displayAvatarURL({ size: 128, extension: "png" });
            res.json({
                id: u.id,
                username: u.username,
                discriminator: u.discriminator,
                tag: u.tag,
                avatar,
                avatarHash: u.avatar,
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Status rápido: ¿está el bot en este guild?
    app.get("/api/guilds/:guildId/status", async (req, res) => {
        try {
            const { guildId } = req.params;
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return res.status(404).json({ present: false });
            res.json({
                present: true,
                name: guild.name,
                memberCount: guild.memberCount,
                icon: guild.icon,
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🌐 API escuchando en el puerto ${PORT}`);
    });
}
