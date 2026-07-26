const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const express = require('express');

// Express server for Render
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Command wiper bot is alive!');
});

app.listen(PORT, () => {
  console.log(`Web server is running on port ${PORT}`);
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}! Wiping all commands...`);

  const GUILD_ID = '1430150908490027090';
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    // Wipe all guild-specific commands
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, GUILD_ID),
      { body: [] },
    );
    console.log('Successfully cleared all server (guild) commands!');

    // Wipe all global commands
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: [] },
    );
    console.log('Successfully cleared all global commands!');
    console.log('Done! Your server is now completely clear of all commands.');
  } catch (error) {
    console.error('Error wiping commands:', error);
  }
});

client.login(process.env.TOKEN);
