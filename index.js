const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}! Clearing all commands...`);

  const GUILD_ID = '1430150908490027090';
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN || process.env.TOKEN2);

  try {
    // Completely wipe out all guild-specific slash commands
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, GUILD_ID),
      { body: [] },
    );
    console.log('Successfully deleted all guild commands!');

    // Completely wipe out all global slash commands
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: [] },
    );
    console.log('Successfully deleted all global commands!');
  } catch (error) {
    console.error('Failed to clear commands:', error);
  }

  // Shut down the script cleanly after flushing
  setTimeout(() => {
    console.log('Command wipe complete. Shutting down client.');
    client.destroy();
    process.exit(0);
  }, 3000);
});

client.login(process.env.TOKEN || process.env.TOKEN2);
