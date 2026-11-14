import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function commandHandler(client) {
  const commandsPath = path.join(__dirname, '../commands');
  const folders = fs.readdirSync(commandsPath);

  for (const folder of folders) {
    const folderPath = path.join(commandsPath, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));
    for (const file of files) {
      const cmd = await import(`file://${path.join(folderPath, file)}`);
      if (cmd.default?.data && cmd.default?.execute) {
        client.commands.set(cmd.default.data.name, cmd.default);
        console.log(`✅ Comando: /${cmd.default.data.name}`);
      }
    }
  }
}
