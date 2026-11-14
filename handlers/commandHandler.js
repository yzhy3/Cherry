const fs = require('fs');
const path = require('path');

module.exports = (client) => {
  const commandsPath = path.join(__dirname, '../commands');

  fs.readdirSync(commandsPath).forEach(category => {
    const categoryPath = path.join(commandsPath, category);
    if (!fs.statSync(categoryPath).isDirectory()) return;

    const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'));
    files.forEach(file => {
      const command = require(`${categoryPath}/${file}`);
      if (!command.name) return;

      client.commands.set(command.name, command);

      if (command.aliases && Array.isArray(command.aliases)) {
        command.aliases.forEach(alias => client.aliases.set(alias, command.name));
      }

      console.log(`[CHERRY] Loaded command: ${command.name} (${category})`);
    });
  });

  console.log(`\n[CHERRY] Loaded ${client.commands.size} commands total.\n`);
};
