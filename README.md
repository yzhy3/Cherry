# 🍒 Cherry Bot — Estilo MEE6 (Node.js)

Bot multipropósito inspirado en MEE6.  
**Estructura simple** (como tu Cherry original) + Dashboard en Next.js para Vercel.

---

## 📁 Estructura (fácil de entender)

```
cherry-mee6/
├── index.js                 ← Arranca el bot
├── deploy-commands.js       ← Despliega los slash commands
├── functions.js             ← Helpers (embeds, placeholders...)
├── config.json              ← Configuración general
├── owner.json
├── keep_alive.js            ← Opcional
├── .env.example
│
├── commands/                ← Todos los comandos slash
│   ├── admin/               (set-welcome, set-autorole, set-modlog, set-levelrole)
│   ├── leveling/            (rank, leaderboard)
│   ├── mod/                 (ban, kick, timeout, warn, warnings, clear)
│   ├── utility/             (help, ping)
│   └── info/
│
├── handlers/                ← Cargadores de comandos
├── events/                  ← Eventos de Discord
├── database/                ← SQLite
├── api/                     ← API interna para el Dashboard
│
└── dashboard/               ← Next.js (se despliega en Vercel)
```

---

## ✨ Features

- Welcome + AutoRole
- Leveling (XP, rank, leaderboard, role rewards)
- Moderación completa + AutoMod anti-invite
- TempVoice
- Dashboard web con OAuth Discord

---

## 🚀 Cómo arrancar el BOT

```bash
# 1. Entrar a la carpeta
cd cherry-mee6

# 2. Instalar
npm install

# 3. Configurar
cp .env.example .env
# Edita .env con tu token, CLIENT_ID, secrets, etc.

# 4. Desplegar comandos slash
npm run deploy

# 5. Iniciar
npm start
```

### Variables importantes (`.env`)

```env
DISCORD_TOKEN=...
CLIENT_ID=...
CLIENT_SECRET=...
DISCORD_REDIRECT_URI=https://tu-dashboard.vercel.app/api/auth/callback
DASHBOARD_URL=https://tu-dashboard.vercel.app
SESSION_SECRET=cadena_larga_aleatoria
INTERNAL_API_SECRET=otra_cadena_larga
PORT=3001
PUBLIC_BOT_URL=https://tu-bot-host.com
```

---

## 🌐 Dashboard en Vercel

1. Sube la carpeta `dashboard/` a Vercel (o pon root directory = `dashboard`).
2. Variables de entorno en Vercel:

```env
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
NEXTAUTH_URL=https://tu-proyecto.vercel.app
NEXTAUTH_SECRET=cadena_aleatoria
BOT_API_URL=https://tu-bot-host.com
BOT_API_SECRET=el_mismo_INTERNAL_API_SECRET
```

3. En Discord Developer Portal → OAuth2 → Redirects añade:
```
https://tu-proyecto.vercel.app/api/auth/callback
```

---

## 📋 Comandos

| Categoría     | Comandos                                      |
|---------------|-----------------------------------------------|
| Leveling      | `/rank` `/leaderboard` `/set-levelrole`      |
| Moderación    | `/ban` `/kick` `/timeout` `/warn` `/warnings` `/clear` |
| Admin         | `/set-welcome` `/set-autorole` `/set-modlog` |
| Utilidad      | `/help` `/ping`                               |

---

## 🗄 Base de datos

SQLite automático en `data/cherry.db`.  
No tienes que crear nada a mano.

---

## Notas

- El **bot** va en cualquier host (Railway, Render, VPS...).
- El **dashboard** va en **Vercel**.
- La API del bot tiene que ser pública para que el dashboard pueda hablar con él.

---

**Cherry** 🍒 — Estructura simple, potencia de MEE6.
