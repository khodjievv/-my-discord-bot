const { REST, Routes } = require('discord.js');
const express = require('express');

// Dummy server so Render doesn't crash if it looks for a web service
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Clearing script alive!'));
app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));

const CLIENT_ID = process.env.CLIENT_ID; // Your Bot's Client ID
const GUILD_ID = '1430150908490027090';
const TOKEN = process.env.TOKEN;

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function clearCommands() {
  try {
    console.log('Started clearing old commands...');

    // 1. Wipe server-specific (guild) commands
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
    console.log('Successfully cleared all server commands!');

    // 2. Wipe global commands just in case
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
    console.log('Successfully cleared all global commands!');

  } catch (error) {
    console.error(error);
  }
}

clearCommands();
