// Opcional: útil si hosteas en Replit u otros servicios que necesitan un puerto abierto
import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Cherry is alive 🍒');
});

const port = process.env.KEEP_ALIVE_PORT || 8080;
server.listen(port, () => {
  console.log(`Keep-alive escuchando en puerto ${port}`);
});
