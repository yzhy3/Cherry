import db from '../database/db.js';

export default {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
    try {
      // User joined a creator channel
      if (newState.channelId && !oldState.channelId) {
        const isCreator = db.prepare(
          'SELECT 1 FROM temp_voice_creators WHERE guild_id = ? AND channel_id = ?'
        ).get(newState.guild.id, newState.channelId);

        if (isCreator) {
          const category = newState.channel.parent;
          const channelName = `🔊 ${newState.member.displayName}`;

          const tempChannel = await newState.guild.channels.create({
            name: channelName,
            type: 2, // GuildVoice
            parent: category?.id,
            permissionOverwrites: [
              {
                id: newState.member.id,
                allow: ['ManageChannels', 'MoveMembers', 'MuteMembers', 'DeafenMembers'],
              },
              {
                id: newState.guild.id,
                allow: ['Connect', 'Speak'],
              },
            ],
          });

          db.prepare(
            'INSERT OR REPLACE INTO temp_voices (channel_id, guild_id, owner_id) VALUES (?, ?, ?)'
          ).run(tempChannel.id, newState.guild.id, newState.member.id);

          await newState.member.voice.setChannel(tempChannel).catch(() => {});
        }
      }

      // User left a temp channel → check if empty
      if (oldState.channelId) {
        const temp = db.prepare('SELECT * FROM temp_voices WHERE channel_id = ?').get(oldState.channelId);
        if (temp) {
          const channel = oldState.guild.channels.cache.get(oldState.channelId);
          if (channel && channel.members.size === 0) {
            await channel.delete().catch(() => {});
            db.prepare('DELETE FROM temp_voices WHERE channel_id = ?').run(oldState.channelId);
          }
        }
      }
    } catch (err) {
      console.error('voiceStateUpdate error:', err);
    }
  },
};
