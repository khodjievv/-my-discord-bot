const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const express = require('express');

// Express server for Render
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is alive!');
});

app.listen(PORT, () => {
  console.log(`Web server is running on port ${PORT}`);
});

// Discord Bot setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Define Slash Commands
const commands = [
  new SlashCommandBuilder()
    .setName('pong')
    .setDescription('Replies with Ping!'),

  new SlashCommandBuilder()
    .setName('dm')
    .setDescription('Sends a custom message to a user in their DMs')
    .addUserOption(option => option.setName('user').setDescription('The user to message').setRequired(true))
    .addStringOption(option => option.setName('message').setDescription('The message to send').setRequired(true)),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bans a member from the server')
    .addUserOption(option => option.setName('user').setDescription('The user to ban').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for ban').setRequired(false)),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kicks a member from the server')
    .addUserOption(option => option.setName('user').setDescription('The user to kick').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for kick').setRequired(false)),

  new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeouts a member')
    .addUserOption(option => option.setName('user').setDescription('The user to timeout').setRequired(true))
    .addIntegerOption(option => option.setName('duration').setDescription('Duration in minutes').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for timeout').setRequired(false)),

  new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Sends an announcement message to a specific channel')
    .addChannelOption(option => option.setName('channel').setDescription('The channel to send the announcement to').setRequired(true))
    .addStringOption(option => option.setName('message').setDescription('The announcement message').setRequired(true)),

  new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Shows detailed and cool-looking information about the server')
].map(command => command.toJSON());

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  const GUILD_ID = '1430150908490027090';
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  
  try {
    console.log('Started refreshing guild (/) commands.');
    
    // This overwrites all old commands with ONLY the new array list
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, GUILD_ID),
      { body: commands },
    );
    
    console.log('Successfully reloaded and cleared old guild (/) commands.');
  } catch (error) {
    console.error(error);
  }
});

// Handle Slash Command Interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'pong') {
    await interaction.reply('Ping!');
  } 
  
  else if (commandName === 'dm') {
    const targetUser = interaction.options.getUser('user');
    const messageContent = interaction.options.getString('message');

    try {
      await targetUser.send(messageContent);
      await interaction.reply({ content: `Successfully sent a DM to **${targetUser.tag}**!`, ephemeral: true });
    } catch (error) {
      await interaction.reply({ content: `Could not send a DM to **${targetUser.tag}**. Their DMs might be closed.`, ephemeral: true });
    }
  } 
  
  else if (commandName === 'ban') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) return interaction.reply({ content: 'User not found in this server.', ephemeral: true });

    await member.ban({ reason });
    await interaction.reply(`Successfully banned **${user.tag}**. Reason: ${reason}`);
  } 
  
  else if (commandName === 'kick') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) return interaction.reply({ content: 'User not found in this server.', ephemeral: true });

    await member.kick(reason);
    await interaction.reply(`Successfully kicked **${user.tag}**. Reason: ${reason}`);
  } 
  
  else if (commandName === 'timeout') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }
    const user = interaction.options.getUser('user');
    const duration = interaction.options.getInteger('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) return interaction.reply({ content: 'User not found in this server.', ephemeral: true });

    const durationMs = duration * 60 * 1000;
    await member.timeout(durationMs, reason);
    await interaction.reply(`Successfully timed out **${user.tag}** for ${duration} minutes. Reason: ${reason}`);
  } 
  
  else if (commandName === 'announce') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }
    const channel = interaction.options.getChannel('channel');
    const messageText = interaction.options.getString('message');

    if (!channel.isTextBased()) {
      return interaction.reply({ content: 'Please select a valid text channel.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📢 Server Announcement')
      .setDescription(messageText)
      .setFooter({ text: `Announced by ${interaction.user.tag}` })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    await interaction.reply({ content: `Announcement successfully sent to ${channel}!`, ephemeral: true });
  } 
  
  else if (commandName === 'serverinfo') {
    const { guild } = interaction;
    const owner = await guild.fetchOwner();

    const embed = new EmbedBuilder()
      .setColor('#2b2d31')
      .setTitle(`🛡️ ${guild.name} Server Information`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: '👑 Owner', value: `${owner.user.tag}`, inline: true },
        { name: '👥 Members', value: `${guild.memberCount}`, inline: true },
        { name: '🚀 Boosts', value: `${guild.premiumSubscriptionCount || 0} (Level ${guild.premiumTier})`, inline: true },
        { name: '📅 Created On', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: '💬 Channels', value: `${guild.channels.cache.size}`, inline: true },
        { name: '🌍 Verification Level', value: `${guild.verificationLevel}`, inline: true }
      )
      .setFooter({ text: `Server ID: ${guild.id}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
});

client.login(process.env.TOKEN);
