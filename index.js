const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, ChannelType, PermissionsBitField } = require('discord.js');
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

// Discord Bot setup (Added GuildMembers intent for the Welcomer system)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

// Define Slash Commands (Added ticketpanel command)
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
    .setDescription('Shows detailed and cool-looking information about the server'),

  new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Posts the ticket support portal panel')
].map(command => command.toJSON());

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  const GUILD_ID = '1430150908490027090';
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  
  try {
    console.log('Started refreshing guild (/) commands.');
    
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, GUILD_ID),
      { body: commands },
    );
    
    console.log('Successfully reloaded and updated guild (/) commands.');
  } catch (error) {
    console.error(error);
  }
});

// Welcomer System: Greets new members when they join
client.on('guildMemberAdd', async member => {
  // Change 'welcome' to the exact name of your welcome text channel
  const welcomeChannel = member.guild.channels.cache.find(channel => channel.name === 'welcome' && channel.isTextBased());
  if (!welcomeChannel) return;

  const welcomeEmbed = new EmbedBuilder()
    .setColor('#7289da')
    .setTitle('👋 Welcome to the Server!')
    .setDescription(`Hey ${member}, welcome to **${member.guild.name}**! We are thrilled to have you here. Make sure to check out the rules and enjoy your stay!`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setTimestamp();

  await welcomeChannel.send({ embeds: [welcomeEmbed] });
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

  // Ticket Panel Command (Posts the dropdown menu and banner image)
  else if (commandName === 'ticketpanel') {
    const embed = new EmbedBuilder()
      .setColor('#7289da')
      .setTitle('Support Portal')
      .setDescription('👋 **How can we help you today?**\n\nSelect the most relevant category from the menu below to open a ticket.\n\n**Note:** You can only have one active ticket at a time.')
      .setImage('YOUR_BANNER_IMAGE_URL_HERE'); // Put your direct banner image link here

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ticket_category_select')
        .setPlaceholder('📁 Choose a category...')
        .addOptions([
          { label: 'General Inquiry', value: 'general_inquiry', emoji: '🛡️' },
          { label: 'Player Reporting', value: 'player_reporting', emoji: '⛔' },
          { label: 'Billing & Ranks', value: 'billing_ranks', emoji: '💰' },
          { label: 'Bug Report', value: 'bug_report', emoji: '🐛' },
        ]),
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
});

// Handle Ticket Dropdown Selections (Fixes the "This interaction failed" error)
client.on('interactionCreate', async interaction => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== 'ticket_category_select') return;

  await interaction.deferReply({ ephemeral: true });

  const categoryValue = interaction.values[0];
  const guild = interaction.guild;
  const member = interaction.member;

  // Prevent users from opening multiple tickets at once
  const existingChannel = guild.channels.cache.find(c => c.name === `ticket-${member.user.username.toLowerCase()}`);
  if (existingChannel) {
    return interaction.editReply({ content: `❌ You already have an active ticket open here: ${existingChannel}` });
  }

  try {
    const ticketChannel = await guild.channels.create({
      name: `ticket-${member.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: member.id,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
        },
        {
          id: client.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
        },
      ],
    });

    await interaction.editReply({ content: `✅ Your ticket has been created! Head over to ${ticketChannel}` });

    const welcomeEmbed = new EmbedBuilder()
      .setColor('#7289da')
      .setTitle(`Ticket: ${categoryValue.replace('_', ' ').toUpperCase()}`)
      .setDescription(`Hello ${member}, thank you for reaching out.\n\nPlease describe your issue in detail, and a staff member will be with you shortly.`);

    await ticketChannel.send({ content: `${member}`, embeds: [welcomeEmbed] });

  } catch (error) {
    console.error(error);
    await interaction.editReply({ content: '❌ Failed to create your ticket channel. Please contact an administrator.' });
  }
});

client.login(process.env.TOKEN);
