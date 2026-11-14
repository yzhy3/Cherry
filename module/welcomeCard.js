const { createCanvas, loadImage } = require('@napi-rs/canvas');

async function generateWelcomeCard(member, config) {
    const width = 800;
    const height = 350;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Fondo (Imagen URL o Color sólido)
    ctx.fillStyle = config.bgColor || '#1e1f22';
    ctx.fillRect(0, 0, width, height);

    if (config.bgImage) {
        try {
            const bg = await loadImage(config.bgImage);
            // Ajustar imagen cubriendo todo el canvas (object-fit: cover)
            const scale = Math.max(width / bg.width, height / bg.height);
            const x = (width / 2) - (bg.width / 2) * scale;
            const y = (height / 2) - (bg.height / 2) * scale;
            ctx.drawImage(bg, x, y, bg.width * scale, bg.height * scale);
        } catch (err) {
            console.error('Error cargando fondo:', err.message);
        }
    }

    // 2. Capa oscura semitransparente para que el texto siempre se lea bien (estilo Koya)
    const overlayOpacity = config.overlayOpacity ?? 0.55;
    ctx.fillStyle = `rgba(0, 0, 0, ${overlayOpacity})`;
    ctx.roundRect(20, 20, width - 40, height - 40, 20);
    ctx.fill();

    // 3. Avatar circular en la parte superior central
    const avatarSize = 130;
    const avatarX = width / 2;
    const avatarY = 105;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
    const avatar = await loadImage(avatarURL);
    ctx.drawImage(avatar, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
    ctx.restore();

    // Borde del avatar
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2, true);
    ctx.lineWidth = 6;
    ctx.strokeStyle = config.borderColor || '#ff5c8a'; // Color acento estilo Cherry/Koya
    ctx.stroke();

    // 4. Textos personalizados
    ctx.textAlign = 'center';

    // Título principal (ej. ¡BIENVENIDO!)
    const titleText = (config.cardTitle || '¡BIENVENIDO!')
        .replace('{user}', member.user.username)
        .replace('{server}', member.guild.name);
    ctx.fillStyle = config.titleColor || '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(titleText, width / 2, 220);

    // Nombre del usuario
    ctx.fillStyle = config.usernameColor || '#ff5c8a';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(member.user.tag || member.user.username, width / 2, 260);

    // Subtítulo (ej. Eres el miembro #120)
    const subtitleText = (config.cardSubtitle || 'Eres el miembro #{count} en {server}')
        .replace('{count}', member.guild.memberCount)
        .replace('{server}', member.guild.name)
        .replace('{user}', member.user.username);
    ctx.fillStyle = config.subtitleColor || '#d1d5db';
    ctx.font = '20px sans-serif';
    ctx.fillText(subtitleText, width / 2, 298);

    return canvas.toBuffer('image/png');
}

module.exports = { generateWelcomeCard };
