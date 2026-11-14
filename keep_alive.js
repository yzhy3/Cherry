const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('🍒 CHERRY Bot is alive!');
});

function keepAlive() {
  app.listen(3000, () => {
    console.log('🍒 Keep-alive server running on port 3000');
  });
}

module.exports = keepAlive;
