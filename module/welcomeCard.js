import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, AttachmentBuilder } from 'discord.js';
import { generateWelcomeCard } from '../../module/welcomeCard.js';
import db from '../../database/db.js';

export default {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Configura el sistema de bienvenida estilo Koya')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('canal')
                .setDescription('Establece el canal donde se enviarán las bienvenidas')
                .addChannelOption(opt => opt.setName('canal').setDescription('Canal de texto').addChannelTypes(ChannelType.GuildText).setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('personalizar')
                .setDescription('Personaliza textos, colores y fondo de la tarjeta')
                .addStringOption(opt => opt.setName('mensaje').setDescription('Mensaje fuera de la imagen (usa {user}, {server}, {count})'))
                .addStringOption(opt => opt.setName('titulo').setDescription('Título dentro de la imagen (ej. ¡BIENVENIDO!)'))
                .addStringOption(opt => opt.setName('subtitulo').setDescription('Subtítulo dentro de la imagen (ej. Miembro #{count})'))
                .addStringOption(opt => opt.setName('fondo_url').setDescription('URL directa de la imagen de fondo (.png/.jpg)'))
                .addStringOption(opt => opt.setName('color_borde').setDescription('Color HEX del borde y nombre (ej. #ff5c8a)'))
        )
        .addSubcommand(sub =>
            sub.setName('estado')
                .setDescription('Activa o desactiva las bienvenidas')
                .addBooleanOption(opt => opt.setName('activo').setDescription('¿Activar?').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('test')
                .setDescription('Envía una prueba de bienvenida ahora mismo')
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        let config = await db.getWelcomeConfig(guildId) || {
            enabled: true,
            channelId: interaction.channel.id,
            message: '¡Hola {user}, bienvenido/a a **{server}**!',
            cardTitle: '¡BIENVENIDO!',
            cardSubtitle: 'Eres el miembro #{count}',
            bgImage: '',
            borderColor: '#ff5c8a',
            usernameColor: '#ff5c8a',
            titleColor: '#ffffff',
            subtitleColor: '#d1d5db'
        };

        if (sub === 'canal') {
            const channel = interaction.options.getChannel('canal');
            config.channelId = channel.id;
            config.enabled = true;
            await db.saveWelcomeConfig(guildId, config);
            return interaction.reply({ content: `✅ Canal de bienvenida establecido en ${channel}.`, ephemeral: true });
        }

        if (sub === 'estado') {
            config.enabled = interaction.options.getBoolean('activo');
            await db.saveWelcomeConfig(guildId, config);
            return interaction.reply({ content: `✅ Sistema de bienvenida **${config.enabled ? 'ACTIVADO' : 'DESACTIVADO'}**.`, ephemeral: true });
        }

        if (sub === 'personalizar') {
            const mensaje = interaction.options.getString('mensaje');
            const titulo = interaction.options.getString('titulo');
            const subtitulo = interaction.options.getString('subtitulo');
            const fondo = interaction.options.getString('fondo_url');
            const color = interaction.options.getString('color_borde');

            if (mensaje) config.message = mensaje;
            if (titulo) config.cardTitle = titulo;
            if (subtitulo) config.cardSubtitle = subtitulo;
            if (fondo) config.bgImage = fondo;
            if (color) {
                config.borderColor = color;
                config.usernameColor = color;
            }

            await db.saveWelcomeConfig(guildId, config);
            return interaction.reply({ content: '✅ Configuración de bienvenida actualizada correctamente.', ephemeral: true });
        }

        if (sub === 'test') {
            await interaction.deferReply({ ephemeral: true });
            const buffer = await generateWelcomeCard(interaction.member, config);
            const attachment = new AttachmentBuilder(buffer, { name: 'welcome.png' });
            const text = (config.message || '¡Bienvenido {user}!')
                .replace('{user}', `<@${interaction.user.id}>`)
                .replace('{server}', interaction.guild.name)
                .replace('{count}', interaction.guild.memberCount);

            const targetChannel = interaction.guild.channels.cache.get(config.channelId) || interaction.channel;
            await targetChannel.send({ content: text, files: [attachment] });
            return interaction.editReply({ content: `✅ Prueba enviada a ${targetChannel}.` });
        }
    }
};
