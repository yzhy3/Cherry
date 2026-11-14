import express from 'express';
import cors from 'cors';
import {
  getGuildSettings,
  updateGuildSettings,
  getLeaderboard,
  getWarnings,
  clearWarnings,
  getLevelRoles,
  setLevelRole,
  getTempVoiceCreators,
  setTempVoiceCreators,
} from '../database/db.js';

export function startApiServer(client) {
  const app = express();
  app.use(cors({ origin: process.env.DASHBOARD_URL || '*' }));
  app.use(express.json());

  function auth(req, res, next) {
    const secret = req.headers['x-api-secret'] || req.query.secret;
    if (secret !== process.env.INTERNAL_API_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  }

  app.use(auth);

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      bot: client.user?.tag || null,
      guilds: client.guilds.cache.size,
      uptime: process.uptime(),
    });
  });

  app.get('/api/guilds', (req, res) => {
    const guilds = client.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      icon: g.iconURL({ size: 128 }),
      memberCount: g.memberCount,
    }));
    res.json(guilds);
  });

  app.get('/api/guilds/:guildId/settings', (req, res) => {
    res.json(getGuildSettings(req.params.guildId));
  });

  app.patch('/api/guilds/:guildId/settings', (req, res) => {
    updateGuildSettings(req.params.guildId, req.body);
    res.json({ success: true, settings: getGuildSettings(req.params.guildId) });
  });

  app.get('/api/guilds/:guildId/leaderboard', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    res.json(getLeaderboard(req.params.guildId, limit));
  });

  app.get('/api/guilds/:guildId/level-roles', (req, res) => {
    res.json(getLevelRoles(req.params.guildId));
  });

  app.post('/api/guilds/:guildId/level-roles', (req, res) => {
    const { level, roleId } = req.body;
    setLevelRole(req.params.guildId, level, roleId);
    res.json({ success: true });
  });

  app.get('/api/guilds/:guildId/warnings/:userId', (req, res) => {
    res.json(getWarnings(req.params.guildId, req.params.userId));
  });

  app.delete('/api/guilds/:guildId/warnings/:userId', (req, res) => {
    clearWarnings(req.params.guildId, req.params.userId);
    res.json({ success: true });
  });

  app.get('/api/guilds/:guildId/tempvoice', (req, res) => {
    res.json(getTempVoiceCreators(req.params.guildId));
  });

  app.post('/api/guilds/:guildId/tempvoice', (req, res) => {
    setTempVoiceCreators(req.params.guildId, req.body.channelIds || []);
    res.json({ success: true });
  });

  app.get('/api/guilds/:guildId/channels', (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });
    const channels = guild.channels.cache
      .filter(c => c.type === 0 || c.type === 2 || c.type === 4)
      .map(c => ({ id: c.id, name: c.name, type: c.type, parentId: c.parentId }));
    res.json(channels);
  });

  app.get('/api/guilds/:guildId/roles', (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });
    const roles = guild.roles.cache
      .filter(r => r.id !== guild.id)
      .map(r => ({ id: r.id, name: r.name, color: r.hexColor, position: r.position }))
      .sort((a, b) => b.position - a.position);
    res.json(roles);
  });

  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`🌐 API interna en puerto ${port}`);
  });
}
