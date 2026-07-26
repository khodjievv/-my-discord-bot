const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType, PermissionsBitField } = require('discord.js');
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

// Discord Bot setup with full necessary intents
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
    .setDescription('Sends a custom message to a server member')
    .addUserOption(option => option.setName('user').setDescription('The server member to message').setRequired(true))
    .addStringOption(option => option.setName('message').setDescription('The message to send').setRequired(true)),

  new SlashCommandBuilder()
    .setName('dmID')
    .setDescription('Sends a custom message to any user by their User ID (even if not in server)')
    .addStringOption(option => option.setName('userid').setDescription('The User ID of the person to message').setRequired(true))
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
    .setDescription('Shows detailed information about the server'),

  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Shows detailed information about a specific user')
    .addUserOption(option => option.setName('user').setDescription('The user to inspect').setRequired(false)),

  new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Posts the ticket support portal panel'),

  new SlashCommandBuilder()
    .setName('say')
    .setDescription('Makes the bot say whatever you type')
    .addStringOption(option => 
      option.setName('message')
        .setDescription('The message you want the bot to say')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('gamestats')
    .setDescription('Fetches and displays live stats from your Roblox game'),

  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Check player donation stats from the game')
    .addStringOption(option => 
      option.setName('username')
        .setDescription('Roblox username to lookup')
        .setRequired(true)
    )
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
    .setImage('https://media.discordapp.net/attachments/1458034925793054730/1530870776670982194/combined_newtext_clean.png?ex=6a672603&is=6a65d483&hm=863e295e5ac0ac3058519ca063446f47c07c78f811ffebd5cf64341a2fa5bc42&=&format=webp&quality=lossless&width=1196&height=672')
    .setTimestamp();

  await welcomeChannel.send({ embeds: [welcomeEmbed] });
});

// Auto-Moderation & Commands System (Polls & Giveaways)
const badWords = ['badword1', 'badword2', 'scamlink.com'];

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  // 1. Auto-Moderation
  if (message.guild) {
    const contentLower = message.content.toLowerCase();
    const containsForbidden = badWords.some(word => contentLower.includes(word));
    const containsInvite = contentLower.includes('discord.gg/') || contentLower.includes('discord.com/invite/');

    if (containsForbidden || containsInvite) {
      try {
        await message.delete();
        const warningMsg = await message.channel.send(`${message.author}, that type of content is not allowed here!`);
        setTimeout(() => warningMsg.delete().catch(() => {}), 5000);
        return;
      } catch (err) {
        console.error('Auto-mod deletion failed:', err);
      }
    }
  }

  // 2. Poll System (!poll)
  if (message.content.startsWith('!poll ')) {
    const pollQuery = message.content.slice(6);
    if (!pollQuery) return message.reply('Please provide a question for the poll!');

    const pollEmbed = new EmbedBuilder()
      .setColor('#5200ff')
      .setTitle('📊 Community Poll')
      .setDescription(pollQuery)
      .setFooter({ text: `Poll started by ${message.author.tag}` })
      .setTimestamp();

    const pollMessage = await message.channel.send({ embeds: [pollEmbed] });
    await pollMessage.react('👍');
    await pollMessage.react('👎');
    await message.delete().catch(() => {});
  }

  // 3. Giveaway System (!giveaway)
  if (message.content.startsWith('!giveaway ')) {
    const args = message.content.slice(10).split(' ');
    const prize = args.join(' ');

    if (!prize) return message.reply('Usage: `!giveaway [prize name]`');

    const giveawayEmbed = new EmbedBuilder()
      .setColor('#ffd700')
      .setTitle('🎉 GIVEAWAY TIME! 🎉')
      .setDescription(`Prize: **${prize}**\nReact with 🎉 to enter!\nHosted by: ${message.author}`)
      .setTimestamp();

    const gMessage = await message.channel.send({ embeds: [giveawayEmbed] });
    await gMessage.react('🎉');

    setTimeout(async () => {
      try {
        const fetchedMsg = await message.channel.messages.fetch(gMessage.id);
        const reaction = fetchedMsg.reactions.cache.get('🎉');

        if (!reaction) return message.channel.send('Giveaway ended with no reactions.');

        const users = await reaction.users.fetch();
        const entrants = users.filter(user => !user.bot);

        if (entrants.size === 0) {
          return message.channel.send(`Giveaway for **${prize}** ended, but no valid entries were found!`);
        }

        const winner = entrants.random();
        message.channel.send(`🎊 Congratulations ${winner}! You won the **${prize}**!`);
      } catch (err) {
        console.error('Giveaway error:', err);
      }
    }, 60000); // Ends after 1 minute (Change as needed)
  }

  // 4. DM Forwarding to Log Channel
  if (!message.guild) {
    const logChannelId = '1430151280092905666'; 
    const logChannel = client.channels.cache.get(logChannelId);
    if (!logChannel) return;

    const replyEmbed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`📩 ${message.author.tag} Replied`)
      .setDescription(message.content || '[Attached an image/embed]')
      .addFields({ name: 'User ID', value: message.author.id, inline: true })
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    await logChannel.send({ embeds: [replyEmbed] });
  }
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

    else if (commandName === 'dmid') {
      const userId = interaction.options.getString('userid');
      const messageContent = interaction.options.getString('message');

      try {
        const targetUser = await client.users.fetch(userId);
        await targetUser.send(messageContent);
        await interaction.reply({ content: `Successfully sent a DM to **${targetUser.tag}** using ID!`, ephemeral: true });
      } catch (error) {
        await interaction.reply({ content: `Could not send a DM to that User ID. Make sure the ID is correct and their DMs are open.`, ephemeral: true });
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
        .setDescription('👋 **How can we help you today?**\n\nSelect the most relevant category from the menu below to open a ticket.\n\n**Note:** You can only have one active ticket at a time.')
        .setImage('https://media.discordapp.net/attachments/1430151280092905666/1530853676615205064/image.png?ex=6a671616&is=6a65c496&hm=cd61181efdeb80664d4de273b480112cd5ce3cd0ad2a44b540c3756c4fcc1693&=&format=webp&quality=lossless&width=1218&height=672');

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

    else if (commandName === 'say') {
      const messageText = interaction.options.getString('message');

      await interaction.reply({ content: 'Message sent successfully!', ephemeral: true });
      await interaction.channel.send({ content: messageText });
    }

    else if (commandName === 'gamestats') {
      await interaction.deferReply();

      const universeId = '10543353328'; 

      try {
        const response = await fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`);
        const data = await response.json();

        if (!data.data || data.data.length === 0) {
          return interaction.editReply({ content: '❌ Could not find game data. Check your Universe ID!' });
        }

        const game = data.data[0];

        // Fetch Game Icon/Thumbnail to show on the embed
        const iconRes = await fetch(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`);
        const iconData = await iconRes.json();
        const gameIconUrl = iconData.data?.[0]?.imageUrl || 'https://images.rbxcdn.com/39322bc627582b13fa2592fa44a5359a';

        const votesResponse = await fetch(`https://games.roblox.com/v1/games/${universeId}/votes`);
        const votesData = await votesResponse.json();

        const upVotes = votesData.upVotes || 0;
        const downVotes = votesData.downVotes || 0;
        const totalVotes = upVotes + downVotes;
        const approvalRate = totalVotes > 0 ? Math.round((upVotes / totalVotes) * 100) : 0;

        const embed = new EmbedBuilder()
          .setColor('#00b0f4')
          .setTitle(`⚡ [ 🎮 ${game.name.toUpperCase()} LIVE STATS ] ⚡`)
          .setDescription(
            `**GAME TELEMETRY**\n\n` +
            `👥 **Active Players:** \`${game.playing.toLocaleString()}\`\n` +
            `🚀 **Total Visits:** \`${game.visits.toLocaleString()}\`\n\n` +
            `───────────────────────────────────\n\n` +
            `**COMMUNITY RATINGS**\n\n` +
            `⭐ **Favorites:** \`${game.favoritedCount.toLocaleString()}\` Favorites ⭐\n` +
            `👍 **Approval Rating:** \`${approvalRate}%\` (${upVotes.toLocaleString()} Likes)\n\n` +
            `───────────────────────────────────\n\n` +
            `🌐 **STATUS:** \`ONLINE\``
          )
          .setThumbnail(gameIconUrl)
          .setImage(gameIconUrl)
          .setFooter({ text: `Requested by ${interaction.user.tag}` })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error('Failed to fetch Roblox API:', error);
        await interaction.editReply({ content: '❌ Failed to connect to Roblox API.' });
      }
    }

    else if (commandName === 'stats') {
      await interaction.deferReply();
      const username = interaction.options.getString('username');

      try {
        // 1. Get Roblox User ID from username
        const userRes = await fetch('https://users.roblox.com/v1/users/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: username, limit: 1 })
        });
        const userData = await userRes.json();

        if (!userData.data || userData.data.length === 0) {
          return interaction.editReply({ content: `❌ Could not find a Roblox user with the name **${username}**.` });
        }

        const robloxUser = userData.data[0];
        const userId = robloxUser.id.toString();
        const displayName = robloxUser.displayName;

        // 2. Get Roblox Avatar Thumbnail
        const thumbRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`);
        const thumbData = await thumbRes.json();
        const avatarUrl = thumbData.data?.[0]?.imageUrl || 'https://images.rbxcdn.com/39322bc627582b13fa2592fa44a5359a';

        // 3. Fetch stats directly from your Firebase Realtime Database
        const firebaseRes = await fetch(`https://donate-modded-2b27d-default-rtdb.firebaseio.com/players/${userId}.json`);
        const statsData = await firebaseRes.json();

        // Pull exact keys from your Firebase tree matching your exact layout
        const donated = statsData?.Donated !== undefined ? Number(statsData.Donated).toLocaleString() : "0";
        const raised = statsData?.Raised !== undefined ? Number(statsData.Raised).toLocaleString() : "0";
        const giftbux = statsData?.Giftbux !== undefined ? Number(statsData.Giftbux).toLocaleString() : "0";

        // 4. Build and send the Discord Embed matching your exact visual requirement
        const statsEmbed = new EmbedBuilder()
          .setColor('#2b2d31')
          .setAuthor({ name: 'Puataun Utility', iconURL: 'https://images.rbxcdn.com/39322bc627582b13fa2592fa44a5359a' })
          .setTitle(`✨ ${displayName.toUpperCase()}'S STATS (PDZ)`)
          .setDescription(
            `**Donated** 🌟\n${donated}\n\n` +
            `**Raised** 🎀\n${raised}\n\n` +
            `**Giftbux**\n${giftbux}`
          )
          .setThumbnail(avatarUrl)
          .setFooter({ text: `User ID: ${userId}` })
          .setTimestamp();

        await interaction.editReply({ embeds: [statsEmbed] });
      } catch (error) {
        console.error('Failed to fetch player stats:', error);
        await interaction.editReply({ content: '❌ Failed to fetch player statistics from Firebase/Roblox.' });
      }
    }
  } catch (error) {
    console.error('Error handling command:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true }).catch(() => {});
    }
  }
});

// Handle Ticket Dropdown & Button Actions (Claim & Close)
client.on('interactionCreate', async interaction => {
  if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_category_select') {
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
          { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: member.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
          { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        ],
      });

      await interaction.editReply({ content: `✅ Your ticket has been created! Head over to ${ticketChannel}` });

      const welcomeEmbed = new EmbedBuilder()
        .setColor('#7289da')
        .setTitle(`Ticket: ${categoryValue.replace('_', ' ').toUpperCase()}`)
        .setDescription(`Hello ${member}, thank you for reaching out.\n\nPlease describe your issue in detail, and a staff member will be with you shortly.`);

      const ticketButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('claim_ticket').setLabel('🔒 Claim Ticket').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('close_ticket').setLabel('✖ Close Ticket').setStyle(ButtonStyle.Danger)
      );

      await ticketChannel.send({ content: `${member}`, embeds: [welcomeEmbed], components: [ticketButtons] });

    } catch (error) {
      console.error('Error creating ticket channel:', error);
      await interaction.editReply({ content: '❌ Failed to create your ticket channel. Please check bot permissions.' });
    }
  }

  else if (interaction.isButton()) {
    if (interaction.customId === 'claim_ticket') {
      await interaction.reply({ content: `🎫 This ticket has been claimed by ${interaction.user}!` });
    } 
    
    else if (interaction.customId === 'close_ticket') {
      await interaction.reply({ content: '⚠️ Closing ticket in 5 seconds...' });
      setTimeout(async () => {
        try {
          await interaction.channel.delete();
        } catch (err) {
          console.error('Failed to delete channel:', err);
        }
      }, 5000);
    }
  }
});

client.login(process.env.TOKEN);
