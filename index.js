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

// Discord Bot setup with full necessary intents (Including DirectMessages)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
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
    .setName('unban')
    .setDescription('Unbans a user by their User ID')
    .addStringOption(option => option.setName('userid').setDescription('The ID of the user to unban').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for unban').setRequired(false)),

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
    .setName('warn')
    .setDescription('Issues a warning to a member')
    .addUserOption(option => option.setName('user').setDescription('The user to warn').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for warning').setRequired(true)),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clears a specified number of messages from the channel')
    .addIntegerOption(option => option.setName('amount').setDescription('Number of messages to delete (1-100)').setRequired(true)),

  new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Sends an announcement message to a specific channel')
    .addChannelOption(option => option.setName('channel').setDescription('The channel to send the announcement to').setRequired(true))
    .addStringOption(option => option.setName('message').setDescription('The announcement message').setRequired(true)),

  new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Shows detailed and cool-looking information about the server'),

  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Shows detailed information about a specific user')
    .addUserOption(option => option.setName('user').setDescription('The user to inspect').setRequired(false)),

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

// Welcomer System
client.on('guildMemberAdd', async member => {
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

// DM Reply Listener: Forwards messages sent to the bot's DMs into a specific channel
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (message.guild) return; 

  const logChannelId = 'YOUR_LOG_CHANNEL_ID_HERE'; 
  const logChannel = client.channels.cache.get(logChannelId);
  
  if (!logChannel) return;

  const replyEmbed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(`📩 ${message.author.tag} Replied`)
    .setDescription(message.content || '[Attached an image/embed]')
    .addFields(
      { name: 'User ID', value: message.author.id, inline: true }
    )
    .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
    .setTimestamp();

  await logChannel.send({ embeds: [replyEmbed] });
});

// Handle Slash Command Interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    if (commandName === 'pong') {
      await interaction.reply({ content: 'Ping!', ephemeral: true });
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
      await interaction.reply({ content: `Successfully banned **${user.tag}**. Reason: ${reason}` });
    }

    else if (commandName === 'unban') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      }
      const userId = interaction.options.getString('userid');
      const reason = interaction.options.getString('reason') || 'No reason provided';

      try {
        await interaction.guild.members.unban(userId, reason);
        await interaction.reply({ content: `Successfully unbanned user ID **${userId}**. Reason: ${reason}`, ephemeral: true });
      } catch (error) {
        await interaction.reply({ content: `Could not unban that user. Make sure the User ID is valid and they are actually banned.`, ephemeral: true });
      }
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
      await interaction.reply({ content: `Successfully kicked **${user.tag}**. Reason: ${reason}` });
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
      await interaction.reply({ content: `Successfully timed out **${user.tag}** for ${duration} minutes. Reason: ${reason}` });
    }

    else if (commandName === 'warn') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      }
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason');

      const embed = new EmbedBuilder()
        .setColor('#ffcc00')
        .setTitle('⚠️ You have been warned')
        .setDescription(`You received a warning in **${interaction.guild.name}**.\n\n**Reason:** ${reason}`)
        .setTimestamp();

      try {
        await user.send({ embeds: [embed] });
        await interaction.reply({ content: `Successfully warned **${user.tag}** and sent them a DM notification.`, ephemeral: true });
      } catch (error) {
        await interaction.reply({ content: `Successfully warned **${user.tag}**, but could not send them a DM (their DMs are closed).`, ephemeral: true });
      }
    }

    else if (commandName === 'clear') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      }
      const amount = interaction.options.getInteger('amount');
      if (amount < 1 || amount > 100) {
        return interaction.reply({ content: 'Please provide a number between 1 and 100.', ephemeral: true });
      }

      try {
        await interaction.channel.bulkDelete(amount, true);
        await interaction.reply({ content: `Successfully deleted **${amount}** messages.`, ephemeral: true });
      } catch (error) {
        await interaction.reply({ content: 'Failed to delete messages. Some messages might be older than 14 days.', ephemeral: true });
      }
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

    else if (commandName === 'userinfo') {
      const user = interaction.options.getUser('user') || interaction.user;
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`👤 User Information - ${user.tag}`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '🆔 User ID', value: user.id, inline: true },
          { name: '📅 Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '📥 Joined Server', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true }
        )
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    else if (commandName === 'ticketpanel') {
      const embed = new EmbedBuilder()
        .setColor('#7289da')
        .setTitle('Support Portal')
        .setDescription('👋 **How can we help you today?**\n\nSelect the most relevant category from the menu below to open a ticket.\n\n**Note:** You can only have one active ticket at a time.');
        // Removed the invalid .setImage() line that caused the error

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
  } catch (error) {
    console.error('Error handling command:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true }).catch(() => {});
    }
  }
});

// Handle Ticket Dropdown Selections
client.on('interactionCreate', async interaction => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== 'ticket_category_select') return;

  await interaction.deferReply({ ephemeral: true });

  const categoryValue = interaction.values[0];
  const guild = interaction.guild;
  const member = interaction.member;

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
    console.error('Error creating ticket channel:', error);
    await interaction.editReply({ content: '❌ Failed to create your ticket channel. Please check bot permissions.' });
  }
});

client.login(process.env.TOKEN);
