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

// Helper function to resolve Roblox User ID from ID, Username, or Display Name (Nickname)
async function getRobloxUserId(input) {
  input = input.trim();

  if (/^\d+$/.test(input)) {
    const userRes = await fetch(`https://users.roblox.com/v1/users/${input}`);
    const userData = await userRes.json();
    if (userData && !userData.errors) {
      return { userId: input, displayName: userData.displayName || userData.name };
    }
  }

  const userRes = await fetch('https://users.roblox.com/v1/users/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword: input, limit: 10 })
  });
  const userData = await userRes.json();

  if (userData.data && userData.data.length > 0) {
    const exactMatch = userData.data.find(u => 
      u.name.toLowerCase() === input.toLowerCase() || 
      u.displayName.toLowerCase() === input.toLowerCase()
    ) || userData.data[0];

    return { 
      userId: exactMatch.id.toString(), 
      displayName: exactMatch.displayName || exactMatch.name 
    };
  }

  return null;
}

// Define Slash Commands
const commands = [
  new SlashCommandBuilder().setName('pong').setDescription('Replies with Ping!'),
  new SlashCommandBuilder()
    .setName('dm')
    .setDescription('Sends a custom message to a server member')
    .addUserOption(option => option.setName('user').setDescription('The server member to message').setRequired(true))
    .addStringOption(option => option.setName('message').setDescription('The message to send').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  new SlashCommandBuilder()
    .setName('dmid')
    .setDescription('Sends a custom message to any user by their User ID (even if not in server)')
    .addStringOption(option => option.setName('userid').setDescription('The User ID of the person to message').setRequired(true))
    .addStringOption(option => option.setName('message').setDescription('The message to send').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bans a member from the server')
    .addUserOption(option => option.setName('user').setDescription('The user to ban').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for ban').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unbans a user by their User ID')
    .addStringOption(option => option.setName('userid').setDescription('The ID of the user to unban').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for unban').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kicks a member from the server')
    .addUserOption(option => option.setName('user').setDescription('The user to kick').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for kick').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeouts a member')
    .addUserOption(option => option.setName('user').setDescription('The user to timeout').setRequired(true))
    .addIntegerOption(option => option.setName('duration').setDescription('Duration in minutes').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for timeout').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Issues a warning to a member')
    .addUserOption(option => option.setName('user').setDescription('The user to warn').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for warning').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clears a specified number of messages from the channel')
    .addIntegerOption(option => option.setName('amount').setDescription('Number of messages to delete (1-100)').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Sends an announcement message to a specific channel')
    .addChannelOption(option => option.setName('channel').setDescription('The channel to send the announcement to').setRequired(true))
    .addStringOption(option => option.setName('message').setDescription('The announcement message').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  new SlashCommandBuilder().setName('serverinfo').setDescription('Shows detailed information about the server'),
  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Shows detailed information about a specific user')
    .addUserOption(option => option.setName('user').setDescription('The user to inspect').setRequired(false)),
  new SlashCommandBuilder().setName('ticketpanel').setDescription('Posts the ticket support portal panel').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName('say')
    .setDescription('Makes the bot say whatever you type')
    .addStringOption(option => option.setName('message').setDescription('The message you want the bot to say').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder().setName('gamestats').setDescription('Fetches and displays live stats from your Roblox game'),
  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Check player donation stats from the game')
    .addStringOption(option => option.setName('player').setDescription('Roblox User ID, Username, or Nickname').setRequired(true)),
  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Displays the top 10 player donation leaderboard from the game')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Choose which stat to rank by')
        .setRequired(true)
        .addChoices(
          { name: 'Donated', value: 'Donated' },
          { name: 'Raised', value: 'Raised' },
          { name: 'Giftbux', value: 'Giftbux' },
          { name: 'Robux', value: 'Robux' }
        )
    ),
  new SlashCommandBuilder()
    .setName('resetstats')
    .setDescription('Resets a player specific stat or all stats in Firebase')
    .addStringOption(option => option.setName('player').setDescription('Roblox User ID, Username, or Nickname to reset').setRequired(true))
    .addStringOption(option =>
      option.setName('stat')
        .setDescription('Which stat to reset')
        .setRequired(true)
        .addChoices(
          { name: 'All Stats', value: 'All' },
          { name: 'Donated', value: 'Donated' },
          { name: 'Raised', value: 'Raised' },
          { name: 'Giftbux', value: 'Giftbux' },
          { name: 'Robux', value: 'Robux' }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName('createcode')
    .setDescription('Creates a game promo code and saves it to Firebase')
    .addStringOption(option => option.setName('code').setDescription('The promo code text').setRequired(true))
    .addIntegerOption(option => option.setName('reward').setDescription('The reward amount').setRequired(true))
    .addStringOption(option =>
      option.setName('type')
        .setDescription('The currency/stat type for the reward')
        .setRequired(true)
        .addChoices(
          { name: 'Donated', value: 'Donated' },
          { name: 'Raised', value: 'Raised' },
          { name: 'Giftbux', value: 'Giftbux' },
          { name: 'Robux', value: 'Robux' }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName('deletecode')
    .setDescription('Deletes an existing game promo code from Firebase')
    .addStringOption(option => option.setName('code').setDescription('The promo code to delete').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName('givetitle')
    .setDescription('Grants a custom in-game title or badge to a player')
    .addStringOption(option => option.setName('player').setDescription('Roblox User ID, Username, or Nickname').setRequired(true))
    .addStringOption(option => option.setName('title').setDescription('The custom title or badge name').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName('removetitle')
    .setDescription('Removes the custom in-game title or badge from a player')
    .addStringOption(option => option.setName('player').setDescription('Roblox User ID, Username, or Nickname').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName('syncban')
    .setDescription('Globally bans a user from both Discord and the Roblox game')
    .addUserOption(option => option.setName('target').setDescription('Discord user to ban').setRequired(true))
    .addStringOption(option => option.setName('robloxid').setDescription('Roblox User ID to blacklist').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for global ban').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Host an epic game giveaway')
    .addStringOption(option => option.setName('prize').setDescription('What are you giving away?').setRequired(true))
    .addIntegerOption(option => option.setName('winners').setDescription('Number of winners').setRequired(true))
    .addIntegerOption(option => option.setName('duration').setDescription('Duration in minutes').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a live voting poll synced with Firebase telemetry')
    .addStringOption(option => option.setName('question').setDescription('The question you want to ask').setRequired(true))
    .addStringOption(option => option.setName('option1').setDescription('First choice').setRequired(true))
    .addStringOption(option => option.setName('option2').setDescription('Second choice').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(command => command.toJSON());

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  const GUILD_ID = '1430150908490027090';
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN || process.env.TOKEN2);
  
  try {
    console.log('Refreshing guild commands cleanly...');
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, GUILD_ID),
      { body: commands },
    );
    console.log('Successfully reloaded guild commands without duplicates.');
  } catch (error) {
    console.error(error);
  }
});

// Welcomer System
client.on('guildMemberAdd', async member => {
  const welcomeChannelId = '1430173023201398874';
  const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
  if (!welcomeChannel) return;

  const rulesChannel = member.guild.channels.cache.find(c => c.name === 'rules' && c.isTextBased());
  const ticketsChannel = member.guild.channels.cache.find(c => c.name === 'tickets' && c.isTextBased());

  const rulesMention = rulesChannel ? `<#${rulesChannel.id}>` : '#rules';
  const ticketsMention = ticketsChannel ? `<#${ticketsChannel.id}>` : '#tickets';

  const welcomeEmbed = new EmbedBuilder()
    .setColor('#ff3333')
    .setDescription(
      `welcome to [$] Puataun ! ${member}\n\n` +
      `Here's a few things you can do in this server!\n\n` +
      `📋 | **Read rules before starting a conversation!**\n` +
      `📄 • ${rulesMention} — Click me to read rules!\n\n` +
      `💌 | **This server is a helpful community dedicated on our games!**\n` +
      `Plz Donate\n\n` +
      `🗓️ | **Do not hesitate to ping a staff for any issues!**\n` +
      `If its regarding bugs, staff report or anything else, Create an ticket!\n` +
      `🎟️ • ${ticketsMention} — Click me to view support!\n\n` +
      `🎗️ | **... And thats basically it!**\n` +
      `Look around the server. You'll get it!`
    )
    .setImage('https://media.discordapp.net/attachments/1463872205950685371/1530934820727689316/photo_2026-07-25_19-17-15.jpg?ex=6a6761a8&is=6a661028&hm=e562563c4c8a7d40a77b66a17cf7a9ed4c20d211810bdb29d3f82c28a4ca5f6c&=&format=webp&width=1218&height=672')
    .setTimestamp();

  await welcomeChannel.send({ embeds: [welcomeEmbed] });
});

// Auto-Moderation & Message Event Handlers
const badWords = ['badword1', 'badword2', 'scamlink.com'];

client.on('messageCreate', async message => {
  if (message.author.bot) return;

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

// Handle Slash Command & Button/Poll Interactions
client.on('interactionCreate', async interaction => {
  if (interaction.isButton()) {
    const customId = interaction.customId;

    if (customId.startsWith('enter_gw_')) {
      const giveawayId = customId.replace('enter_gw_', '');
      const userRef = `https://donate-modded-2b27d-default-rtdb.firebaseio.com/ActiveGiveaways/${giveawayId}/participants/${interaction.user.id}.json`;
      
      const checkRes = await fetch(userRef);
      const joined = await checkRes.json();

      if (joined) {
        return interaction.reply({ content: '⚠️ You are already entered into this giveaway!', ephemeral: true });
      }

      await fetch(userRef, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: interaction.user.tag, timestamp: Date.now() })
      });

      return interaction.reply({ content: `✅ **Entry Confirmed!** You are officially entered to win!`, ephemeral: true });
    }

    if (customId.startsWith('vote_')) {
      const parts = customId.split('_');
      const pollId = parts[1];
      const optionNum = parts[2];

      const pollRef = `https://donate-modded-2b27d-default-rtdb.firebaseio.com/Polls/${pollId}.json`;
      const res = await fetch(pollRef);
      const pollData = await res.json();

      if (!pollData) {
        return interaction.reply({ content: '❌ This poll no longer exists.', ephemeral: true });
      }

      if (pollData.voters && pollData.voters[interaction.user.id]) {
        return interaction.reply({ content: '⚠️ You have already voted in this poll!', ephemeral: true });
      }

      const updatedVoters = pollData.voters || {};
      updatedVoters[interaction.user.id] = optionNum;

      let v1 = pollData.votes1 || 0;
      let v2 = pollData.votes2 || 0;
      if (optionNum === '1') v1++;
      if (optionNum === '2') v2++;

      await fetch(pollRef, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votes1: v1, votes2: v2, voters: updatedVoters })
      });

      const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
        .setDescription(`**${pollData.question}**\n\n🟢 **[1]** ${pollData.opt1} (${v1} votes)\n🔵 **[2]** ${pollData.opt2} (${v2} votes)`);

      await interaction.message.edit({ embeds: [updatedEmbed] });
      return interaction.reply({ content: `✅ Successfully voted for option **${optionNum === '1' ? pollData.opt1 : pollData.opt2}**!`, ephemeral: true });
    }

    if (customId === 'close_ticket') {
      await interaction.reply({ content: '🔒 Closing this ticket in 5 seconds...', ephemeral: true });
      setTimeout(async () => {
        try {
          await interaction.channel.delete();
        } catch (err) {
          console.error('Failed to delete ticket channel:', err);
        }
      }, 5000);
      return;
    }

    return;
  }

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
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
      await member.ban({ reason });
      await interaction.reply({ content: `Successfully banned **${user.tag}**. Reason: ${reason}` });
    }
    else if (commandName === 'unban') {
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
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
      await member.kick(reason);
      await interaction.reply({ content: `Successfully kicked **${user.tag}**. Reason: ${reason}` });
    } 
    else if (commandName === 'timeout') {
      const user = interaction.options.getUser('user');
      const duration = interaction.options.getInteger('duration');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
      await member.timeout(duration * 60 * 1000, reason);
      await interaction.reply({ content: `Successfully timed out **${user.tag}** for ${duration} minutes. Reason: ${reason}` });
    }
    else if (commandName === 'warn') {
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
        .setDescription('👋 **How can we help you today?**\n\nSelect the most relevant category from the menu below to open a ticket.')
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
      await interaction.reply({ content: interaction.options.getString('message') });
    }
    else if (commandName === 'gamestats') {
      await interaction.deferReply();
      const universeId = '10543353328'; 
      const response = await fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`);
      const data = await response.json();
      const game = data.data[0];
      const iconRes = await fetch(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`);
      const iconData = await iconRes.json();
      const gameIconUrl = iconData.data?.[0]?.imageUrl || '';
      const votesResponse = await fetch(`https://games.roblox.com/v1/games/${universeId}/votes`);
      const votesData = await votesResponse.json();
      const upVotes = votesData.upVotes || 0;
      const downVotes = votesData.downVotes || 0;
      const totalVotes = upVotes + downVotes;
      const approvalRate = totalVotes > 0 ? Math.round((upVotes / totalVotes) * 100) : 0;

      const embed = new EmbedBuilder()
        .setColor('#00b0f4')
        .setTitle(`⚡ [ 🎮 ${game.name.toUpperCase()} LIVE STATS ] ⚡`)
        .setDescription(`👥 **Active Players:** \`${game.playing.toLocaleString()}\`\n🚀 **Total Visits:** \`${game.visits.toLocaleString()}\`\n⭐ **Favorites:** \`${game.favoritedCount.toLocaleString()}\`\n👍 **Approval:** \`${approvalRate}%\``)
        .setThumbnail(gameIconUrl);

      await interaction.editReply({ embeds: [embed] });
    }
    else if (commandName === 'stats') {
      await interaction.deferReply();
      const resolvedUser = await getRobloxUserId(interaction.options.getString('player'));
      if (!resolvedUser) return interaction.editReply({ content: '❌ User not found.' });

      const firebaseRes = await fetch(`https://donate-modded-2b27d-default-rtdb.firebaseio.com/${resolvedUser.userId}.json`);
      const statsData = await firebaseRes.json();
      if (!statsData) return interaction.editReply({ content: '❌ No stats found.' });

      const statsEmbed = new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle(`✨ ${resolvedUser.displayName.toUpperCase()}'S STATS`)
        .setDescription(`**Donated:** ${statsData.Donated || 0}\n**Raised:** ${statsData.Raised || 0}`);

      await interaction.editReply({ embeds: [statsEmbed] });
    }
    else if (commandName === 'leaderboard') {
      await interaction.deferReply();
      const category = interaction.options.getString('category');
      const firebaseRes = await fetch('https://donate-modded-2b27d-default-rtdb.firebaseio.com/.json');
      const playersData = await firebaseRes.json();
      
      const playerArray = Object.keys(playersData)
        .filter(key => /^\d+$/.test(key))
        .map(userId => ({ userId, val: playersData[userId][category] || 0 }))
        .sort((a, b) => b.val - a.val)
        .slice(0, 10);

      const leaderboardEmbed = new EmbedBuilder()
        .setColor('#ffd700')
        .setTitle(`🏆 TOP 10 ${category.toUpperCase()}`);

      for (let i = 0; i < playerArray.length; i++) {
        leaderboardEmbed.addFields({ name: `#${i + 1}`, value: `ID: ${playerArray[i].userId} - ${playerArray[i].val}` });
      }
      await interaction.editReply({ embeds: [leaderboardEmbed] });
    }
    else if (commandName === 'giveaway') {
      const prize = interaction.options.getString('prize');
      const winnerCount = interaction.options.getInteger('winners');
      const durationMinutes = interaction.options.getInteger('duration');
      const endTime = Date.now() + (durationMinutes * 60 * 1000);
      const giveawayId = `gw_${Date.now()}`;

      await fetch(`https://donate-modded-2b27d-default-rtdb.firebaseio.com/ActiveGiveaways/${giveawayId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prize, participants: {}, status: 'active', endTime })
      });

      const enterButton = new ButtonBuilder().setCustomId(`enter_gw_${giveawayId}`).setLabel('🎉 ENTER GIVEAWAY').setStyle(ButtonStyle.Success);
      const row = new ActionRowBuilder().addComponents(enterButton);
      const embed = new EmbedBuilder().setTitle('🎉 GIVEAWAY').setDescription(`Prize: **${prize}**`);
      
      await interaction.reply({ embeds: [embed], components: [row] });
    }
    else if (commandName === 'poll') {
      const question = interaction.options.getString('question');
      const opt1 = interaction.options.getString('option1');
      const opt2 = interaction.options.getString('option2');
      const pollId = `poll_${Date.now()}`;

      await fetch(`https://donate-modded-2b27d-default-rtdb.firebaseio.com/Polls/${pollId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, opt1, opt2, votes1: 0, votes2: 0, voters: {} })
      });

      const btn1 = new ButtonBuilder().setCustomId(`vote_${pollId}_1`).setLabel(opt1).setStyle(ButtonStyle.Primary);
      const btn2 = new ButtonBuilder().setCustomId(`vote_${pollId}_2`).setLabel(opt2).setStyle(ButtonStyle.Secondary);
      const row = new ActionRowBuilder().addComponents(btn1, btn2);

      const embed = new EmbedBuilder().setTitle('📊 POLL').setDescription(`**${question}**`);
      await interaction.reply({ embeds: [embed], components: [row] });
    }
  } catch (error) {
    console.error('Error handling command:', error);
  }
});

// Single Login Call (Fixed duplication cause)
client.login(process.env.TOKEN || process.env.TOKEN2);
