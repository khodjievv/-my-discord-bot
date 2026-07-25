const { REST, Routes } = require('discord.js');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Clearing script alive!'));
app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));

const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = '1430150908490027090';
const TOKEN = process.env.TOKEN;

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function clearAllCommands() {
  try {
    console.log('Started clearing all commands...');

    // 1. Wipe all server-specific commands
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
    console.log('Successfully wiped all server (guild) commands!');

    // 2. Wipe all global commands (this kills those stubborn old ones)
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
    console.log('Successfully wiped all global commands!');

  } catch (error) {
    console.error(error);
  }
}

clearAllCommands();
