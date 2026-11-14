# 🍒 Cherry Bot — Estilo MEE6 (Node.js)

Estructura simple + compatible con **Bot-Hosting**.

## Arrancar en Bot-Hosting

1. Sube **todos los archivos** (excepto la carpeta `dashboard`)
2. En el panel pon como archivo de inicio: `server.js`
3. Comando de inicio recomendado:
```
npm install && node server.js
```
4. Variables de entorno:
```
DISCORD_TOKEN=tu_token
CLIENT_ID=tu_client_id
CLIENT_SECRET=tu_client_secret
SESSION_SECRET=cadena_larga
INTERNAL_API_SECRET=otra_cadena_larga
PORT=3001
```

## Desplegar comandos

En la consola del hosting (o localmente):
```
node deploy-commands.js
```

## Dashboard

La carpeta `dashboard/` se sube a **Vercel** por separado.

## Base de datos

Usa un archivo JSON (`data/cherry.json`). **No necesita** better-sqlite3 ni módulos nativos → funciona en Bot-Hosting.

## Comandos

- `/rank` `/leaderboard` `/set-levelrole`
- `/ban` `/kick` `/timeout` `/warn` `/warnings` `/clear`
- `/set-welcome` `/set-autorole` `/set-modlog`
- `/help` `/ping`
