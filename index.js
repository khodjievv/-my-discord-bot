const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType, PermissionsBitField } = require('discord.js');[cite: 1]
const express = require('express');[cite: 1]

// Express server for Render[cite: 1]
const app = express();[cite: 1]
const PORT = process.env.PORT || 3000;[cite: 1]

app.get('/', (req, res) => {[cite: 1]
  res.send('Bot is alive!');[cite: 1]
});[cite: 1]

app.listen(PORT, () => {[cite: 1]
  console.log(`Web server is running on port ${PORT}`);[cite: 1]
});[cite: 1]

// Discord Bot setup with full necessary intents[cite: 1]
const client = new Client({[cite: 1]
  intents: [[cite: 1]
    GatewayIntentBits.Guilds,[cite: 1]
    GatewayIntentBits.GuildMessages,[cite: 1]
    GatewayIntentBits.GuildMembers,[cite: 1]
    GatewayIntentBits.MessageContent,[cite: 1]
    GatewayIntentBits.DirectMessages[cite: 1]
  ][cite: 1]
});[cite: 1]

// Helper function to resolve Roblox User ID from ID, Username, or Display Name (Nickname)[cite: 1]
async function getRobloxUserId(input) {[cite: 1]
  input = input.trim();[cite: 1]

  // 1. If it's purely numbers, treat it as a User ID[cite: 1]
  if (/^\d+$/.test(input)) {[cite: 1]
    const userRes = await fetch(`https://users.roblox.com/v1/users/${input}`);[cite: 1]
    const userData = await userRes.json();[cite: 1]
    if (userData && !userData.errors) {[cite: 1]
      return { userId: input, displayName: userData.displayName || userData.name };[cite: 1]
    }[cite: 1]
  }[cite: 1]

  // 2. Search by keyword (Handles Usernames and Display Names/Nicknames)[cite: 1]
  const userRes = await fetch('https://users.roblox.com/v1/users/search', {[cite: 1]
    method: 'POST',[cite: 1]
    headers: { 'Content-Type': 'application/json' },[cite: 1]
    body: JSON.stringify({ keyword: input, limit: 10 })[cite: 1]
  });[cite: 1]
  const userData = await userRes.json();[cite: 1]

  if (userData.data && userData.data.length > 0) {[cite: 1]
    const exactMatch = userData.data.find(u =>[cite: 1]
      u.name.toLowerCase() === input.toLowerCase() ||[cite: 1]
      u.displayName.toLowerCase() === input.toLowerCase()[cite: 1]
    ) || userData.data[0];[cite: 1]

    return {[cite: 1]
      userId: exactMatch.id.toString(),[cite: 1]
      displayName: exactMatch.displayName || exactMatch.name[cite: 1]
    };[cite: 1]
  }[cite: 1]

  return null;[cite: 1]
}[cite: 1]

// Define Slash Commands[cite: 1]
const commands = [[cite: 1]
  new SlashCommandBuilder()[cite: 1]
    .setName('pong')[cite: 1]
    .setDescription('Replies with Ping!'),[cite: 1]

  new SlashCommandBuilder()[cite: 1]
    .setName('dm')[cite: 1]
    .setDescription('Sends a custom message to a server member')[cite: 1]
    .addUserOption(option => option.setName('user').setDescription('The server member to message').setRequired(true))[cite: 1]
    .addStringOption(option => option.setName('message').setDescription('The message to send').setRequired(true)),[cite: 1]

  new SlashCommandBuilder()[cite: 1]
    .setName('dmid')[cite: 1]
    .setDescription('Sends a custom message to any user by their User ID (even if not in server)')[cite: 1]
    .addStringOption(option => option.setName('userid').setDescription('The User ID of the person to message').setRequired(true))[cite: 1]
    .addStringOption(option => option.setName('message').setDescription('The message to send').setRequired(true)),[cite: 1]

  new SlashCommandBuilder()[cite: 1]
    .setName('ban')[cite: 1]
    .setDescription('Bans a member from the server')[cite: 1]
    .addUserOption(option => option.setName('user').setDescription('The user to ban').setRequired(true))[cite: 1]
    .addStringOption(option => option.setName('reason').setDescription('Reason for ban').setRequired(false)),[cite: 1]

  new SlashCommandBuilder()[cite: 1]
    .setName('unban')[cite: 1]
    .setDescription('Unbans a user by their User ID')[cite: 1]
    .addStringOption(option => option.setName('userid').setDescription('The ID of the user to unban').setRequired(true))[cite: 1]
    .addStringOption(option => option.setName('reason').setDescription('Reason for unban').setRequired(false)),[cite: 1]

  new SlashCommandBuilder()[cite: 1]
    .setName('kick')[cite: 1]
    .setDescription('Kicks a member from the server')[cite: 1]
    .addUserOption(option => option.setName('user').setDescription('The user to kick').setRequired(true))[cite: 1]
    .addStringOption(option => option.setName('reason').setDescription('Reason for kick').setRequired(false)),[cite: 1]

  new SlashCommandBuilder()[cite: 1]
    .setName('timeout')[cite: 1]
    .setDescription('Timeouts a member')[cite: 1]
    .addUserOption(option => option.setName('user').setDescription('The user to timeout').setRequired(true))[cite: 1]
    .addIntegerOption(option => option.setName('duration').setDescription('Duration in minutes').setRequired(true))[cite: 1]
    .addStringOption(option => option.setName('reason').setDescription('Reason for timeout').setRequired(false)),[cite: 1]

  new SlashCommandBuilder()[cite: 1]
    .setName('warn')[cite: 1]
    .setDescription('Issues a warning to a member')[cite: 1]
    .addUserOption(option => option.setName('user').setDescription('The user to warn').setRequired(true))[cite: 1]
    .addStringOption(option => option.setName('reason').setDescription('Reason for warning').setRequired(true)),[cite: 1]

  new SlashCommandBuilder()[cite: 1]
    .setName('clear')[cite: 1]
    .setDescription('Clears a specified number of messages from the channel')[cite: 1]
    .addIntegerOption(option => option.setName('amount').setDescription('Number of messages to delete (1-100)').setRequired(true)),[cite: 1]

  new SlashCommandBuilder()[cite: 1]
    .setName('announce')[cite: 1]
    .setDescription('Sends an announcement message to a specific channel')[cite: 1]
    .addChannelOption(option => option.setName('channel').setDescription('The channel to send the announcement to').setRequired(true))[cite: 1]
    .addStringOption(option => option.setName('message').setDescription('The announcement message').setRequired(true)),[cite: 1]

  new SlashCommandBuilder()[cite: 1]
    .setName('serverinfo')[cite: 1]
    .setDescription('Shows detailed information about the server'),[cite: 1]

  new SlashCommandBuilder()[cite: 1]
    .setName('userinfo')[cite: 1]
    .setDescription('Shows detailed information about a specific user')[cite: 1]
    .addUserOption(option => option.setName('user').setDescription('The user to inspect').setRequired(false)),[cite: 1]

  new SlashCommandBuilder()[cite: 1]
    .setName('ticketpanel')[cite: 1]
    .setDescription('Posts the ticket support portal panel'),[cite: 1]

  new SlashCommandBuilder()[cite: 1]
    .setName('say')[cite: 1]
    .setDescription('Makes the bot say whatever you type')[cite: 1]
    .addStringOption(option =>[cite: 1]
      option.setName('message')[cite: 1]
        .setDescription('The message you want the bot to say')[cite: 1]
        .setRequired(true)[cite: 1]
    ),[cite: 1]

  new SlashCommandBuilder()[cite: 1]
    .setName('gamestats')[cite: 1]
    .setDescription('Fetches and displays live stats from your Roblox game'),[cite: 1]

  new SlashCommandBuilder()[cite: 1]
    .setName('stats')[cite: 1]
    .setDescription('Check player donation stats from the game')[cite: 1]
    .addStringOption(option =>[cite: 1]
      option.setName('player')[cite: 1]
        .setDescription('Roblox User ID, Username, or Nickname')[cite: 1]
        .setRequired(true)[cite: 1]
    ),[cite: 1]

  new SlashCommandBuilder()[cite: 1]
    .setName('leaderboard')[cite: 1]
    .setDescription('Displays the top 10 player donation leaderboard from the game')[cite: 1]
    .addStringOption(option =>[cite: 1]
      option.setName('category')[cite: 1]
        .setDescription('Choose which stat to rank by')[cite: 1]
        .setRequired(true)[cite: 1]
        .addChoices([cite: 1]
          { name: 'Donated', value: 'Donated' },[cite: 1]
          { name: 'Raised', value: 'Raised' },[cite: 1]
          { name: 'Giftbux', value: 'Giftbux' },[cite: 1]
          { name: 'Robux', value: 'Robux' }[cite: 1]
        )[cite: 1]
    ),[cite: 1]

  new SlashCommandBuilder()[cite: 1]
    .setName('resetstats')[cite: 1]
    .setDescription('Resets a player specific stat or all stats in Firebase')[cite: 1]
    .addStringOption(option =>[cite: 1]
      option.setName('player')[cite: 1]
        .setDescription('Roblox User ID, Username, or Nickname to reset')[cite: 1]
        .setRequired(true)[cite: 1]
    )[cite: 1]
    .addStringOption(option =>[cite: 1]
      option.setName('stat')[cite: 1]
        .setDescription('Which stat to reset')[cite: 1]
        .setRequired(true)[cite: 1]
        .addChoices([cite: 1]
          { name: 'All Stats', value: 'All' },[cite: 1]
          { name: 'Donated', value: 'Donated' },[cite: 1]
          { name: 'Raised', value: 'Raised' },[cite: 1]
          { name: 'Giftbux', value: 'Giftbux' },[cite: 1]
          { name: 'Robux', value: 'Robux' }[cite: 1]
        )[cite: 1]
    ),[cite: 1]

  new SlashCommandBuilder()[cite: 1]
    .setName('createcode')[cite: 1]
    .setDescription('Creates a game promo code and saves it to Firebase')[cite: 1]
    .addStringOption(option => option.setName('code').setDescription('The promo code text (e.g., RELEASE)').setRequired(true))[cite: 1]
    .addIntegerOption(option => option.setName('reward').setDescription('The reward amount').setRequired(true))[cite: 1]
    .addStringOption(option =>[cite: 1]
      option.setName('type')[cite: 1]
        .setDescription('The currency/stat type for the reward')[cite: 1]
        .setRequired(true)[cite: 1]
        .addChoices([cite: 1]
          { name: 'Donated', value: 'Donated' },[cite: 1]
          { name: 'Raised', value: 'Raised' },[cite: 1]
          { name: 'Giftbux', value: 'Giftbux' },[cite: 1]
          { name: 'Robux', value: 'Robux' }[cite: 1]
        )[cite: 1]
    ),[cite: 1]

  new SlashCommandBuilder()[cite: 1]
    .setName('deletecode')[cite: 1]
    .setDescription('Deletes an existing game promo code from Firebase')[cite: 1]
    .addStringOption(option => option.setName('code').setDescription('The promo code to delete').setRequired(true)),[cite: 1]
    
  new SlashCommandBuilder()[cite: 1]
    .setName('givetitle')[cite: 1]
    .setDescription('Grants a custom in-game title or badge to a player')[cite: 1]
    .addStringOption(option => option.setName('player').setDescription('Roblox User ID, Username, or Nickname').setRequired(true))[cite: 1]
    .addStringOption(option => option.setName('title').setDescription('The custom title or badge name (e.g., VIP)').setRequired(true)),[cite: 1]

  new SlashCommandBuilder()[cite: 1]
    .setName('removetitle')[cite: 1]
    .setDescription('Removes the custom in-game title or badge from a player')[cite: 1]
    .addStringOption(option => option.setName('player').setDescription('Roblox User ID, Username, or Nickname').setRequired(true)),[cite: 1]

  new SlashCommandBuilder()[cite: 1]
    .setName('syncban')[cite: 1]
    .setDescription('Globally bans a user from both Discord and the Roblox game')[cite: 1]
    .addUserOption(option => option.setName('target').setDescription('Discord user to ban').setRequired(true))[cite: 1]
    .addStringOption(option => option.setName('robloxid').setDescription('Roblox User ID to blacklist').setRequired(true))[cite: 1]
    .addStringOption(option => option.setName('reason').setDescription('Reason for global ban').setRequired(false)),[cite: 1]

  new SlashCommandBuilder()[cite: 1]
    .setName('giveaway')[cite: 1]
    .setDescription('Host an epic game giveaway')[cite: 1]
    .addStringOption(option => option.setName('prize').setDescription('What are you giving away? (e.g. 5,000 Robux)').setRequired(true))[cite: 1]
    .addIntegerOption(option => option.setName('winners').setDescription('Number of winners').setRequired(true))[cite: 1]
    .addIntegerOption(option => option.setName('duration').setDescription('Duration in minutes').setRequired(true)),[cite: 1]

  new SlashCommandBuilder()[cite: 1]
    .setName('poll')[cite: 1]
    .setDescription('Create a live voting poll synced with Firebase telemetry')[cite: 1]
    .addStringOption(option => option.setName('question').setDescription('The question you want to ask').setRequired(true))[cite: 1]
    .addStringOption(option => option.setName('option1').setDescription('First choice').setRequired(true))[cite: 1]
    .addStringOption(option => option.setName('option2').setDescription('Second choice').setRequired(true))[cite: 1]
].map(command => command.toJSON());[cite: 1]

client.once('ready', async () => {[cite: 1]
  console.log(`Logged in as ${client.user.tag}!`);[cite: 1]

  const GUILD_ID = '1430150908490027090';[cite: 1]
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);[cite: 1]
  
  try {[cite: 1]
    console.log('Started refreshing guild (/) commands.');[cite: 1]
    await rest.put([cite: 1]
      Routes.applicationGuildCommands(client.user.id, GUILD_ID),[cite: 1]
      { body: commands },[cite: 1]
    );[cite: 1]
    console.log('Successfully reloaded and updated guild (/) commands.');[cite: 1]
  } catch (error) {[cite: 1]
    console.error(error);[cite: 1]
  }[cite: 1]
});[cite: 1]

// Welcomer System[cite: 1]
client.on('guildMemberAdd', async member => {[cite: 1]
  const welcomeChannelId = '1430173023201398874';[cite: 1]
  const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);[cite: 1]
  if (!welcomeChannel) return;[cite: 1]

  const rulesChannel = member.guild.channels.cache.find(c => c.name === 'rules' && c.isTextBased());[cite: 1]
  const ticketsChannel = member.guild.channels.cache.find(c => c.name === 'tickets' && c.isTextBased());[cite: 1]

  const rulesMention = rulesChannel ? `<#${rulesChannel.id}>` : '#rules';[cite: 1]
  const ticketsMention = ticketsChannel ? `<#${ticketsChannel.id}>` : '#tickets';[cite: 1]

  const welcomeEmbed = new EmbedBuilder()[cite: 1]
    .setColor('#ff3333')[cite: 1]
    .setDescription([cite: 1]
      `welcome to [$] Puataun ! ${member}\n\n` +[cite: 1]
      `Here's a few things you can do in this server!\n\n` +[cite: 1]
      `📋 | **Read rules before starting a conversation!**\n` +[cite: 1]
      `📄 • ${rulesMention} — Click me to read rules!\n\n` +[cite: 1]
      `💌 | **This server is a helpful community dedicated on our games!**\n` +[cite: 1]
      `Plz Donate\n\n` +[cite: 1]
      `🗓️ | **Do not hesitate to ping a staff for any issues!**\n` +[cite: 1]
      `If its regarding bugs, staff report or anything else, Create an ticket!\n` +[cite: 1]
      `🎟️ • ${ticketsMention} — Click me to view support!\n\n` +[cite: 1]
      `🎗️ | **... And thats basically it!**\n` +[cite: 1]
      `Look around the server. You'll get it!`[cite: 1]
    )[cite: 1]
    .setImage('https://media.discordapp.net/attachments/1463872205950685371/1530934820727689316/photo_2026-07-25_19-17-15.jpg?ex=6a6761a8&is=6a661028&hm=e562563c4c8a7d40a77b66a17cf7a9ed4c20d211810bdb29d3f82c28a4ca5f6c&=&format=webp&width=1218&height=672')[cite: 1]
    .setTimestamp();[cite: 1]

  await welcomeChannel.send({ embeds: [welcomeEmbed] });[cite: 1]
});[cite: 1]

// Auto-Moderation & Message Event Handlers[cite: 1]
const badWords = ['badword1', 'badword2', 'scamlink.com'];[cite: 1]

client.on('messageCreate', async message => {[cite: 1]
  if (message.author.bot) return;[cite: 1]

  // 1. Auto-Moderation[cite: 1]
  if (message.guild) {[cite: 1]
    const contentLower = message.content.toLowerCase();[cite: 1]
    const containsForbidden = badWords.some(word => contentLower.includes(word));[cite: 1]
    const containsInvite = contentLower.includes('discord.gg/') || contentLower.includes('discord.com/invite/');[cite: 1]

    if (containsForbidden || containsInvite) {[cite: 1]
      try {[cite: 1]
        await message.delete();[cite: 1]
        const warningMsg = await message.channel.send(`${message.author}, that type of content is not allowed here!`);[cite: 1]
        setTimeout(() => warningMsg.delete().catch(() => {}), 5000);[cite: 1]
        return;[cite: 1]
      } catch (err) {[cite: 1]
        console.error('Auto-mod deletion failed:', err);[cite: 1]
      }[cite: 1]
    }[cite: 1]
  }[cite: 1]

  // 2. DM Forwarding to Log Channel[cite: 1]
  if (!message.guild) {[cite: 1]
    const logChannelId = '1430151280092905666';[cite: 1]
    const logChannel = client.channels.cache.get(logChannelId);[cite: 1]
    if (!logChannel) return;[cite: 1]

    const replyEmbed = new EmbedBuilder()[cite: 1]
      .setColor('#5865F2')[cite: 1]
      .setTitle(`📩 ${message.author.tag} Replied`)[cite: 1]
      .setDescription(message.content || '[Attached an image/embed]')[cite: 1]
      .addFields({ name: 'User ID', value: message.author.id, inline: true })[cite: 1]
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))[cite: 1]
      .setTimestamp();[cite: 1]

    await logChannel.send({ embeds: [replyEmbed] });[cite: 1]
  }[cite: 1]
});[cite: 1]

// Handle Slash Command & Button/Poll Interactions[cite: 1]
client.on('interactionCreate', async interaction => {[cite: 1]
  // Handle Button / Interactive Component Clicks[cite: 1]
  if (interaction.isButton()) {[cite: 1]
    const customId = interaction.customId;[cite: 1]

    // A. Giveaway Entry Button Handler[cite: 1]
    if (customId.startsWith('enter_gw_')) {[cite: 1]
      const giveawayId = customId.replace('enter_gw_', '');[cite: 1]
      const userRef = `https://donate-modded-2b27d-default-rtdb.firebaseio.com/ActiveGiveaways/${giveawayId}/participants/${interaction.user.id}.json`;[cite: 1]
      
      const checkRes = await fetch(userRef);[cite: 1]
      const joined = await checkRes.json();[cite: 1]

      if (joined) {[cite: 1]
        return interaction.reply({ content: '⚠️ You are already entered into this giveaway!', ephemeral: true });[cite: 1]
      }[cite: 1]

      await fetch(userRef, {[cite: 1]
        method: 'PUT',[cite: 1]
        headers: { 'Content-Type': 'application/json' },[cite: 1]
        body: JSON.stringify({ username: interaction.user.tag, timestamp: Date.now() })[cite: 1]
      });[cite: 1]

      return interaction.reply({ content: `✅ **Entry Confirmed!** You are officially entered to win!`, ephemeral: true });[cite: 1]
    }[cite: 1]

    // B. Poll Voting Button Handler[cite: 1]
    if (customId.startsWith('vote_')) {[cite: 1]
      const parts = customId.split('_');[cite: 1]
      const pollId = parts[1];[cite: 1]
      const optionNum = parts[2]; // '1' or '2'[cite: 1]

      const pollRef = `https://donate-modded-2b27d-default-rtdb.firebaseio.com/Polls/${pollId}.json`;[cite: 1]
      const res = await fetch(pollRef);[cite: 1]
      const pollData = await res.json();[cite: 1]

      if (!pollData) {[cite: 1]
        return interaction.reply({ content: '❌ This poll no longer exists.', ephemeral: true });[cite: 1]
      }[cite: 1]

      if (pollData.voters && pollData.voters[interaction.user.id]) {[cite: 1]
        return interaction.reply({ content: '⚠️ You have already voted in this poll!', ephemeral: true });[cite: 1]
      }[cite: 1]

      // Update vote counts and track voter[cite: 1]
      const updatedVoters = pollData.voters || {};[cite: 1]
      updatedVoters[interaction.user.id] = optionNum;[cite: 1]

      let v1 = pollData.votes1 || 0;[cite: 1]
      let v2 = pollData.votes2 || 0;[cite: 1]
      if (optionNum === '1') v1++;[cite: 1]
      if (optionNum === '2') v2++;[cite: 1]

      await fetch(pollRef, {[cite: 1]
        method: 'PATCH',[cite: 1]
        headers: { 'Content-Type': 'application/json' },[cite: 1]
        body: JSON.stringify({ votes1: v1, votes2: v2, voters: updatedVoters })[cite: 1]
      });[cite: 1]

      // Update embed UI dynamically[cite: 1]
      const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])[cite: 1]
        .setDescription(`**${pollData.question}**\n\n🟢 **[1]** ${pollData.opt1} (${v1} votes)\n🔵 **[2]** ${pollData.opt2} (${v2} votes)`);[cite: 1]

      await interaction.message.edit({ embeds: [updatedEmbed] });[cite: 1]
      return interaction.reply({ content: `✅ Successfully voted for option **${optionNum === '1' ? pollData.opt1 : pollData.opt2}**!`, ephemeral: true });[cite: 1]
    }[cite: 1]
    return;[cite: 1]
  }[cite: 1]

  if (!interaction.isChatInputCommand()) return;[cite: 1]

  const { commandName } = interaction;[cite: 1]

  try {[cite: 1]
    if (commandName === 'pong') {[cite: 1]
      await interaction.reply({ content: 'Ping!', ephemeral: true });[cite: 1]
    }[cite: 1]
    
    else if (commandName === 'dm') {[cite: 1]
      const targetUser = interaction.options.getUser('user');[cite: 1]
      const messageContent = interaction.options.getString('message');[cite: 1]

      try {[cite: 1]
        await targetUser.send(messageContent);[cite: 1]
        await interaction.reply({ content: `Successfully sent a DM to **${targetUser.tag}**!`, ephemeral: true });[cite: 1]
      } catch (error) {[cite: 1]
        await interaction.reply({ content: `Could not send a DM to **${targetUser.tag}**. Their DMs might be closed.`, ephemeral: true });[cite: 1]
      }[cite: 1]
    }

    else if (commandName === 'dmid') {[cite: 1]
      const userId = interaction.options.getString('userid');[cite: 1]
      const messageContent = interaction.options.getString('message');[cite: 1]

      try {[cite: 1]
        const targetUser = await client.users.fetch(userId);[cite: 1]
        await targetUser.send(messageContent);[cite: 1]
        await interaction.reply({ content: `Successfully sent a DM to **${targetUser.tag}** using ID!`, ephemeral: true });[cite: 1]
      } catch (error) {[cite: 1]
        await interaction.reply({ content: `Could not send a DM to that User ID. Make sure the ID is correct and their DMs are open.`, ephemeral: true });[cite: 1]
      }[cite: 1]
    }[cite: 1]
    
    else if (commandName === 'ban') {[cite: 1]
      if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {[cite: 1]
        return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });[cite: 1]
      }[cite: 1]
      const user = interaction.options.getUser('user');[cite: 1]
      const reason = interaction.options.getString('reason') || 'No reason provided';[cite: 1]
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);[cite: 1]

      if (!member) return interaction.reply({ content: 'User not found in this server.', ephemeral: true });[cite: 1]

      await member.ban({ reason });[cite: 1]
      await interaction.reply({ content: `Successfully banned **${user.tag}**. Reason: ${reason}` });[cite: 1]
    }

    else if (commandName === 'unban') {[cite: 1]
      if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {[cite: 1]
        return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });[cite: 1]
      }[cite: 1]
      const userId = interaction.options.getString('userid');[cite: 1]
      const reason = interaction.options.getString('reason') || 'No reason provided';[cite: 1]

      try {[cite: 1]
        await interaction.guild.members.unban(userId, reason);[cite: 1]
        await interaction.reply({ content: `Successfully unbanned user ID **${userId}**. Reason: ${reason}`, ephemeral: true });[cite: 1]
      } catch (error) {[cite: 1]
        await interaction.reply({ content: `Could not unban that user. Make sure the User ID is valid and they are actually banned.`, ephemeral: true });[cite: 1]
      }[cite: 1]
    }[cite: 1]
    
    else if (commandName === 'kick') {[cite: 1]
      if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {[cite: 1]
        return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });[cite: 1]
      }[cite: 1]
      const user = interaction.options.getUser('user');[cite: 1]
      const reason = interaction.options.getString('reason') || 'No reason provided';[cite: 1]
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);[cite: 1]

      if (!member) return interaction.reply({ content: 'User not found in this server.', ephemeral: true });[cite: 1]

      await member.kick(reason);[cite: 1]
      await interaction.reply({ content: `Successfully kicked **${user.tag}**. Reason: ${reason}` });[cite: 1]
    }[cite: 1]
    
    else if (commandName === 'timeout') {[cite: 1]
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {[cite: 1]
        return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });[cite: 1]
      }[cite: 1]
      const user = interaction.options.getUser('user');[cite: 1]
      const duration = interaction.options.getInteger('duration');[cite: 1]
      const reason = interaction.options.getString('reason') || 'No reason provided';[cite: 1]
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);[cite: 1]

      if (!member) return interaction.reply({ content: 'User not found in this server.', ephemeral: true });[cite: 1]

      const durationMs = duration * 60 * 1000;[cite: 1]
      await member.timeout(durationMs, reason);[cite: 1]
      await interaction.reply({ content: `Successfully timed out **${user.tag}** for ${duration} minutes. Reason: ${reason}` });[cite: 1]
    }

    else if (commandName === 'warn') {[cite: 1]
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {[cite: 1]
        return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });[cite: 1]
      }[cite: 1]
      const user = interaction.options.getUser('user');[cite: 1]
      const reason = interaction.options.getString('reason');[cite: 1]

      const embed = new EmbedBuilder()[cite: 1]
        .setColor('#ffcc00')[cite: 1]
        .setTitle('⚠️ You have been warned')[cite: 1]
        .setDescription(`You received a warning in **${interaction.guild.name}**.\n\n**Reason:** ${reason}`)[cite: 1]
        .setTimestamp();[cite: 1]

      try {[cite: 1]
        await user.send({ embeds: [embed] });[cite: 1]
        await interaction.reply({ content: `Successfully warned **${user.tag}** and sent them a DM notification.`, ephemeral: true });[cite: 1]
      } catch (error) {[cite: 1]
        await interaction.reply({ content: `Successfully warned **${user.tag}**, but could not send them a DM (their DMs are closed).`, ephemeral: true });[cite: 1]
      }[cite: 1]
    }

    else if (commandName === 'clear') {[cite: 1]
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {[cite: 1]
        return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });[cite: 1]
      }[cite: 1]
      const amount = interaction.options.getInteger('amount');[cite: 1]
      if (amount < 1 || amount > 100) {[cite: 1]
        return interaction.reply({ content: 'Please provide a number between 1 and 100.', ephemeral: true });[cite: 1]
      }[cite: 1]

      try {[cite: 1]
        await interaction.channel.bulkDelete(amount, true);[cite: 1]
        await interaction.reply({ content: `Successfully deleted **${amount}** messages.`, ephemeral: true });[cite: 1]
      } catch (error) {[cite: 1]
        await interaction.reply({ content: 'Failed to delete messages. Some messages might be older than 14 days.', ephemeral: true });[cite: 1]
      }[cite: 1]
    }[cite: 1]
    
    else if (commandName === 'announce') {[cite: 1]
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {[cite: 1]
        return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });[cite: 1]
      }[cite: 1]
      const channel = interaction.options.getChannel('channel');[cite: 1]
      const messageText = interaction.options.getString('message');[cite: 1]

      if (!channel.isTextBased()) {[cite: 1]
        return interaction.reply({ content: 'Please select a valid text channel.', ephemeral: true });[cite: 1]
      }[cite: 1]

      const embed = new EmbedBuilder()[cite: 1]
        .setColor('#5865F2')[cite: 1]
        .setTitle('📢 Server Announcement')[cite: 1]
        .setDescription(messageText)[cite: 1]
        .setFooter({ text: `Announced by ${interaction.user.tag}` })[cite: 1]
        .setTimestamp();[cite: 1]

      await channel.send({ embeds: [embed] });[cite: 1]
      await interaction.reply({ content: `Announcement successfully sent to ${channel}!`, ephemeral: true });[cite: 1]
    }[cite: 1]
    
    else if (commandName === 'serverinfo') {[cite: 1]
      const { guild } = interaction;[cite: 1]
      const owner = await guild.fetchOwner();[cite: 1]

      const embed = new EmbedBuilder()[cite: 1]
        .setColor('#2b2d31')[cite: 1]
        .setTitle(`🛡️ ${guild.name} Server Information`)[cite: 1]
        .setThumbnail(guild.iconURL({ dynamic: true }))[cite: 1]
        .addFields([cite: 1]
          { name: '👑 Owner', value: `${owner.user.tag}`, inline: true },[cite: 1]
          { name: '👥 Members', value: `${guild.memberCount}`, inline: true },[cite: 1]
          { name: '🚀 Boosts', value: `${guild.premiumSubscriptionCount || 0} (Level ${guild.premiumTier})`, inline: true },[cite: 1]
          { name: '📅 Created On', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },[cite: 1]
          { name: '💬 Channels', value: `${guild.channels.cache.size}`, inline: true },[cite: 1]
          { name: '🌍 Verification Level', value: `${guild.verificationLevel}`, inline: true }[cite: 1]
        )[cite: 1]
        .setFooter({ text: `Server ID: ${guild.id}` })[cite: 1]
        .setTimestamp();[cite: 1]

      await interaction.reply({ embeds: [embed] });[cite: 1]
    }

    else if (commandName === 'userinfo') {[cite: 1]
      const user = interaction.options.getUser('user') || interaction.user;[cite: 1]
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);[cite: 1]

      const embed = new EmbedBuilder()[cite: 1]
        .setColor('#5865F2')[cite: 1]
        .setTitle(`👤 User Information - ${user.tag}`)[cite: 1]
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))[cite: 1]
        .addFields([cite: 1]
          { name: '🆔 User ID', value: user.id, inline: true },[cite: 1]
          { name: '📅 Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },[cite: 1]
          { name: '📥 Joined Server', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true }[cite: 1]
        )[cite: 1]
        .setFooter({ text: `Requested by ${interaction.user.tag}` })[cite: 1]
        .setTimestamp();[cite: 1]

      await interaction.reply({ embeds: [embed] });[cite: 1]
    }

    else if (commandName === 'ticketpanel') {[cite: 1]
      const embed = new EmbedBuilder()[cite: 1]
        .setColor('#7289da')[cite: 1]
        .setTitle('Support Portal')[cite: 1]
        .setDescription('👋 **How can we help you today?**\n\nSelect the most relevant category from the menu below to open a ticket.\n\n**Note:** You can only have one active ticket at a time.')[cite: 1]
        .setImage('https://media.discordapp.net/attachments/1430151280092905666/1530853676615205064/image.png?ex=6a671616&is=6a65c496&hm=cd61181efdeb80664d4de273b480112cd5ce3cd0ad2a44b540c3756c4fcc1693&=&format=webp&quality=lossless&width=1218&height=672');[cite: 1]

      const row = new ActionRowBuilder().addComponents([cite: 1]
        new StringSelectMenuBuilder()[cite: 1]
          .setCustomId('ticket_category_select')[cite: 1]
          .setPlaceholder('📁 Choose a category...')[cite: 1]
          .addOptions([[cite: 1]
            { label: 'General Inquiry', value: 'general_inquiry', emoji: '🛡️' },[cite: 1]
            { label: 'Player Reporting', value: 'player_reporting', emoji: '⛔' },[cite: 1]
            { label: 'Billing & Ranks', value: 'billing_ranks', emoji: '💰' },[cite: 1]
            { label: 'Bug Report', value: 'bug_report', emoji: '🐛' },[cite: 1]
          ]),[cite: 1]
      );[cite: 1]

      await interaction.reply({ embeds: [embed], components: [row] });[cite: 1]
    }

    else if (commandName === 'say') {[cite: 1]
      const messageText = interaction.options.getString('message');[cite: 1]
      await interaction.reply({ content: messageText });[cite: 1]
    }

    else if (commandName === 'gamestats') {[cite: 1]
      await interaction.deferReply();[cite: 1]

      const universeId = '10543353328';[cite: 1]

      try {[cite: 1]
        const response = await fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`);[cite: 1]
        const data = await response.json();[cite: 1]

        if (!data.data || data.data.length === 0) {[cite: 1]
          return interaction.editReply({ content: '❌ Could not find game data. Check your Universe ID!' });[cite: 1]
        }[cite: 1]

        const game = data.data[0];[cite: 1]

        const iconRes = await fetch(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`);[cite: 1]
        const iconData = await iconRes.json();[cite: 1]
        const gameIconUrl = iconData.data?.[0]?.imageUrl || 'https://images.rbxcdn.com/39322bc627582b13fa2592fa44a5359a';[cite: 1]

        const votesResponse = await fetch(`https://games.roblox.com/v1/games/${universeId}/votes`);[cite: 1]
        const votesData = await votesResponse.json();[cite: 1]

        const upVotes = votesData.upVotes || 0;[cite: 1]
        const downVotes = votesData.downVotes || 0;[cite: 1]
        const totalVotes = upVotes + downVotes;[cite: 1]
        const approvalRate = totalVotes > 0 ? Math.round((upVotes / totalVotes) * 100) : 0;[cite: 1]

        const embed = new EmbedBuilder()[cite: 1]
          .setColor('#00b0f4')[cite: 1]
          .setTitle(`⚡ [ 🎮 ${game.name.toUpperCase()} LIVE STATS ] ⚡`)[cite: 1]
          .setDescription([cite: 1]
            `**GAME TELEMETRY**\n\n` +[cite: 1]
            `👥 **Active Players:** \`${game.playing.toLocaleString()}\`\n` +[cite: 1]
            `🚀 **Total Visits:** \`${game.visits.toLocaleString()}\`\n\n` +[cite: 1]
            `───────────────────────────────────\n\n` +[cite: 1]
            `**COMMUNITY RATINGS**\n\n` +[cite: 1]
            `⭐ **Favorites:** \`${game.favoritedCount.toLocaleString()}\` Favorites ⭐\n` +[cite: 1]
            `👍 **Approval Rating:** \`${approvalRate}%\` (${upVotes.toLocaleString()} Likes)\n\n` +[cite: 1]
            `───────────────────────────────────\n\n` +[cite: 1]
            `🌐 **STATUS:** \`ONLINE\``[cite: 1]
          )[cite: 1]
          .setThumbnail(gameIconUrl)[cite: 1]
          .setImage(gameIconUrl)[cite: 1]
          .setFooter({ text: `Requested by ${interaction.user.tag}` })[cite: 1]
          .setTimestamp();[cite: 1]

        await interaction.editReply({ embeds: [embed] });[cite: 1]
      } catch (error) {[cite: 1]
        console.error('Failed to fetch Roblox API:', error);[cite: 1]
        await interaction.editReply({ content: '❌ Failed to connect to Roblox API.' });[cite: 1]
      }[cite: 1]
    }

    else if (commandName === 'stats') {[cite: 1]
      await interaction.deferReply();[cite: 1]
      const input = interaction.options.getString('player');[cite: 1]

      try {[cite: 1]
        const resolvedUser = await getRobloxUserId(input);[cite: 1]
        if (!resolvedUser) {[cite: 1]
          return interaction.editReply({ content: `❌ Could not find a Roblox user matching **"${input}"** (try User ID, Username, or Nickname).` });[cite: 1]
        }[cite: 1]

        const userId = resolvedUser.userId;[cite: 1]
        const displayName = resolvedUser.displayName;[cite: 1]

        const thumbRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`);[cite: 1]
        const thumbData = await thumbRes.json();[cite: 1]
        const avatarUrl = thumbData.data?.[0]?.imageUrl || 'https://images.rbxcdn.com/39322bc627582b13fa2592fa44a5359a';[cite: 1]

        const firebaseRes = await fetch(`https://donate-modded-2b27d-default-rtdb.firebaseio.com/${userId}.json`);[cite: 1]
        const statsData = await firebaseRes.json();[cite: 1]

        if (!statsData) {[cite: 1]
          return interaction.editReply({ content: `❌ No stats found in the database for **${displayName}** (ID: \`${userId}\`).` });[cite: 1]
        }[cite: 1]

        const donated = statsData.Donated ?? statsData.donated ?? 0;[cite: 1]
        const raised = statsData.Raised ?? statsData.raised ?? 0;[cite: 1]
        const giftbux = statsData.Giftbux ?? statsData.giftbux ?? 0;[cite: 1]
        const robux = statsData.Robux ?? statsData.robux ?? 0;[cite: 1]

        const statsEmbed = new EmbedBuilder()[cite: 1]
          .setColor('#2b2d31')[cite: 1]
          .setAuthor({ name: 'Puataun Utility', iconURL: 'https://images.rbxcdn.com/39322bc627582b13fa2592fa44a5359a' })[cite: 1]
          .setTitle(`✨ ${displayName.toUpperCase()}'S STATS (PDZ)`)[cite: 1]
          .setDescription([cite: 1]
            `**Donated** 🌟\n${Number(donated).toLocaleString()}\n\n` +[cite: 1]
            `**Raised** 🎀\n${Number(raised).toLocaleString()}\n\n` +[cite: 1]
            `**Giftbux**\n${Number(giftbux).toLocaleString()}\n\n` +[cite: 1]
            `**Robux** 💎\n${Number(robux).toLocaleString()}`[cite: 1]
          )[cite: 1]
          .setThumbnail(avatarUrl)[cite: 1]
          .setFooter({ text: `User ID: ${userId}` })[cite: 1]
          .setTimestamp();[cite: 1]

        await interaction.editReply({ embeds: [statsEmbed] });[cite: 1]
      } catch (error) {[cite: 1]
        console.error('Failed to fetch player stats:', error);[cite: 1]
        await interaction.editReply({ content: '❌ Failed to fetch player statistics from Firebase/Roblox.' });[cite: 1]
      }[cite: 1]
    }

    else if (commandName === 'leaderboard') {[cite: 1]
      await interaction.deferReply();[cite: 1]
      const category = interaction.options.getString('category');[cite: 1]

      try {[cite: 1]
        const firebaseRes = await fetch('https://donate-modded-2b27d-default-rtdb.firebaseio.com/.json');[cite: 1]
        const playersData = await firebaseRes.json();[cite: 1]

        if (!playersData) {[cite: 1]
          return interaction.editReply({ content: '❌ No player data found in Firebase yet!' });[cite: 1]
        }[cite: 1]

        const playerArray = Object.keys(playersData)[cite: 1]
          .filter(key => /^\d+$/.test(key))[cite: 1]
          .map(userId => {[cite: 1]
            const p = playersData[userId] || {};[cite: 1]
            return {[cite: 1]
              userId: userId,[cite: 1]
              Donated: p.Donated ?? p.donated ?? 0,[cite: 1]
              Raised: p.Raised ?? p.raised ?? 0,[cite: 1]
              Giftbux: p.Giftbux ?? p.giftbux ?? 0,[cite: 1]
              Robux: p.Robux ?? p.robux ?? 0[cite: 1]
            };[cite: 1]
          });[cite: 1]

        playerArray.sort((a, b) => {[cite: 1]
          const valA = Number(a[category]) || 0;[cite: 1]
          const valB = Number(b[category]) || 0;[cite: 1]
          return valB - valA;[cite: 1]
        });[cite: 1]

        const topPlayers = playerArray.slice(0, 10);[cite: 1]

        if (topPlayers.length === 0) {[cite: 1]
          return interaction.editReply({ content: '❌ Not enough player data to build a leaderboard.' });[cite: 1]
        }[cite: 1]

        const leaderboardEmbed = new EmbedBuilder()[cite: 1]
          .setColor('#ffd700')[cite: 1]
          .setTitle(`🏆 TOP 10 ${category.toUpperCase()} LEADERBOARD`)[cite: 1]
          .setFooter({ text: `Requested by ${interaction.user.tag}` })[cite: 1]
          .setTimestamp();[cite: 1]

        for (let i = 0; i < topPlayers.length; i++) {[cite: 1]
          const player = topPlayers[i];[cite: 1]
          const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `\`#${i + 1}\``;[cite: 1]
          
          let username = `User ID: ${player.userId}`;[cite: 1]
          let avatarUrl = 'https://images.rbxcdn.com/39322bc627582b13fa2592fa44a5359a';[cite: 1]

          try {[cite: 1]
            const userRes = await fetch(`https://users.roblox.com/v1/users/${player.userId}`);[cite: 1]
            const userData = await userRes.json();[cite: 1]
            if (userData && userData.name) {[cite: 1]
              username = `**${userData.displayName || userData.name}** (\`@${userData.name}\`)`;[cite: 1]
            }

            const thumbRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${player.userId}&size=150x150&format=Png&isCircular=false`);[cite: 1]
            const thumbData = await thumbRes.json();[cite: 1]
            if (thumbData.data?.[0]?.imageUrl) {[cite: 1]
              avatarUrl = thumbData.data[0].imageUrl;[cite: 1]
            }
          } catch (e) {[cite: 1]
            // Fallback if API fails[cite: 1]
          }

          const statValue = Number(player[category] || 0).toLocaleString();[cite: 1]
          
          leaderboardEmbed.addFields({[cite: 1]
            name: `${rankEmoji} Rank ${i + 1}`,[cite: 1]
            value: `👤 ${username}\n🖼️ [Avatar Link](${avatarUrl})\n📊 **${category}:** \`${statValue}\``,[cite: 1]
            inline: false[cite: 1]
          });[cite: 1]
        }

        await interaction.editReply({ embeds: [leaderboardEmbed] });[cite: 1]
      } catch (error) {[cite: 1]
        console.error('Failed to generate leaderboard:', error);[cite: 1]
        await interaction.editReply({ content: '❌ Failed to fetch leaderboard data from Firebase.' });[cite: 1]
      }[cite: 1]
    }

    else if (commandName === 'resetstats') {[cite: 1]
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {[cite: 1]
        return interaction.reply({ content: '❌ You need **Administrator** permissions to use this command.', ephemeral: true });[cite: 1]
      }

      await interaction.deferReply({ ephemeral: true });[cite: 1]
      const input = interaction.options.getString('player');[cite: 1]
      const statChoice = interaction.options.getString('stat');[cite: 1]

      try {[cite: 1]
        const resolvedUser = await getRobloxUserId(input);[cite: 1]
        if (!resolvedUser) {[cite: 1]
          return interaction.editReply({ content: `❌ Could not find a Roblox user matching **"${input}"**.` });[cite: 1]
        }

        const userId = resolvedUser.userId;[cite: 1]
        const displayName = resolvedUser.displayName;[cite: 1]

        const firebaseCheckRes = await fetch(`https://donate-modded-2b27d-default-rtdb.firebaseio.com/${userId}.json`);[cite: 1]
        const existingData = await firebaseCheckRes.json();[cite: 1]

        if (!existingData) {[cite: 1]
          return interaction.editReply({ content: `❌ No record exists in Firebase for **${displayName}** (ID: \`${userId}\`).` });[cite: 1]
        }

        if (statChoice === 'All') {[cite: 1]
          await fetch(`https://donate-modded-2b27d-default-rtdb.firebaseio.com/${userId}.json`, {[cite: 1]
            method: 'PATCH',[cite: 1]
            headers: { 'Content-Type': 'application/json' },[cite: 1]
            body: JSON.stringify({ Donated: 0, Raised: 0, Giftbux: 0, Robux: 0 })[cite: 1]
          });[cite: 1]
        } else {[cite: 1]
          const updateObj = {};[cite: 1]
          updateObj[statChoice] = 0;[cite: 1]
          await fetch(`https://donate-modded-2b27d-default-rtdb.firebaseio.com/${userId}.json`, {[cite: 1]
            method: 'PATCH',[cite: 1]
            headers: { 'Content-Type': 'application/json' },[cite: 1]
            body: JSON.stringify(updateObj)[cite: 1]
          });[cite: 1]
        }

        const resetEmbed = new EmbedBuilder()[cite: 1]
          .setColor('#ff3333')[cite: 1]
          .setTitle('🗑️ Player Stats Reset Successful')[cite: 1]
          .setDescription(`Successfully reset **${statChoice}** for **${displayName}** (\`@${userId}\`) in Firebase.`)[cite: 1]
          .setTimestamp();[cite: 1]

        await interaction.editReply({ embeds: [resetEmbed] });[cite: 1]
      } catch (error) {[cite: 1]
        console.error('Failed to reset stats in Firebase:', error);[cite: 1]
        await interaction.editReply({ content: '❌ Failed to connect to Firebase to reset player stats.' });[cite: 1]
      }[cite: 1]
    }

    else if (commandName === 'createcode') {[cite: 1]
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {[cite: 1]
        return interaction.reply({ content: '❌ You need **Administrator** permissions to use this command.', ephemeral: true });[cite: 1]
      }

      await interaction.deferReply({ ephemeral: true });[cite: 1]
      const code = interaction.options.getString('code').trim().toUpperCase();[cite: 1]
      const reward = interaction.options.getInteger('reward');[cite: 1]
      const type = interaction.options.getString('type');[cite: 1]

      try {[cite: 1]
        await fetch(`https://donate-modded-2b27d-default-rtdb.firebaseio.com/Codes/${code}.json`, {[cite: 1]
          method: 'PUT',[cite: 1]
          headers: { 'Content-Type': 'application/json' },[cite: 1]
          body: JSON.stringify({ reward: reward, type: type })[cite: 1]
        });[cite: 1]

        const codeEmbed = new EmbedBuilder()[cite: 1]
          .setColor('#57F287')[cite: 1]
          .setTitle('🎟️ Promo Code Created')[cite: 1]
          .setDescription(`Successfully created promo code **${code}**!\n\n🎁 **Reward:** \`${reward.toLocaleString()} ${type}\``)[cite: 1]
          .setTimestamp();[cite: 1]

        await interaction.editReply({ embeds: [codeEmbed] });[cite: 1]
      } catch (error) {[cite: 1]
        console.error('Failed to create code in Firebase:', error);[cite: 1]
        await interaction.editReply({ content: '❌ Failed to save promo code to Firebase.' });[cite: 1]
      }[cite: 1]
    }

    else if (commandName === 'deletecode') {[cite: 1]
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {[cite: 1]
        return interaction.reply({ content: '❌ You need **Administrator** permissions to use this command.', ephemeral: true });[cite: 1]
      }

      await interaction.deferReply({ ephemeral: true });[cite: 1]
      const code = interaction.options.getString('code').trim().toUpperCase();[cite: 1]

      try {[cite: 1]
        await fetch(`https://donate-modded-2b27d-default-rtdb.firebaseio.com/Codes/${code}.json`, {[cite: 1]
          method: 'DELETE'[cite: 1]
        });[cite: 1]

        const codeEmbed = new EmbedBuilder()[cite: 1]
          .setColor('#ED4245')[cite: 1]
          .setTitle('🗑️ Promo Code Deleted')[cite: 1]
          .setDescription(`Successfully deleted promo code **${code}** from Firebase.`)[cite: 1]
          .setTimestamp();[cite: 1]

        await interaction.editReply({ embeds: [codeEmbed] });[cite: 1]
      } catch (error) {[cite: 1]
        console.error('Failed to delete code from Firebase:', error);[cite: 1]
        await interaction.editReply({ content: '❌ Failed to delete promo code from Firebase.' });[cite: 1]
      }[cite: 1]
    }

    else if (commandName === 'givetitle') {[cite: 1]
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {[cite: 1]
        return interaction.reply({ content: '❌ You need **Administrator** permissions to use this command.', ephemeral: true });[cite: 1]
      }

      await interaction.deferReply({ ephemeral: true });[cite: 1]
      const input = interaction.options.getString('player');[cite: 1]
      const customTitle = interaction.options.getString('title');[cite: 1]

      try {[cite: 1]
        const resolvedUser = await getRobloxUserId(input);[cite: 1]
        if (!resolvedUser) {[cite: 1]
          return interaction.editReply({ content: `❌ Could not find a Roblox user matching **"${input}"**.` });[cite: 1]
        }

        const userId = resolvedUser.userId;[cite: 1]
        const displayName = resolvedUser.displayName;[cite: 1]

        await fetch(`https://donate-modded-2b27d-default-rtdb.firebaseio.com/${userId}.json`, {[cite: 1]
          method: 'PATCH',[cite: 1]
          headers: { 'Content-Type': 'application/json' },[cite: 1]
          body: JSON.stringify({ SpecialTitle: customTitle })[cite: 1]
        });[cite: 1]

        const titleEmbed = new EmbedBuilder()[cite: 1]
          .setColor('#5865F2')[cite: 1]
          .setTitle('✨ In-Game Title Granted')[cite: 1]
          .setDescription(`Successfully granted the title **"${customTitle}"** to **${displayName}** (\`@${userId}\`).`)[cite: 1]
          .setTimestamp();[cite: 1]

        await interaction.editReply({ embeds: [titleEmbed] });[cite: 1]
      } catch (error) {[cite: 1]
        console.error('Failed to grant title in Firebase:', error);[cite: 1]
        await interaction.editReply({ content: '❌ Failed to save custom title to Firebase.' });[cite: 1]
      }[cite: 1]
    }

    else if (commandName === 'removetitle') {[cite: 1]
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {[cite: 1]
        return interaction.reply({ content: '❌ You need **Administrator** permissions to use this command.', ephemeral: true });[cite: 1]
      }

      await interaction.deferReply({ ephemeral: true });[cite: 1]
      const input = interaction.options.getString('player');[cite: 1]

      try {[cite: 1]
        const resolvedUser = await getRobloxUserId(input);[cite: 1]
        if (!resolvedUser) {[cite: 1]
          return interaction.editReply({ content: `❌ Could not find a Roblox user matching **"${input}"**.` });[cite: 1]
        }

        const userId = resolvedUser.userId;[cite: 1]
        const displayName = resolvedUser.displayName;[cite: 1]

        await fetch(`https://donate-modded-2b27d-default-rtdb.firebaseio.com/${userId}/SpecialTitle.json`, {[cite: 1]
          method: 'DELETE'[cite: 1]
        });[cite: 1]

        const titleEmbed = new EmbedBuilder()[cite: 1]
          .setColor('#ED4245')[cite: 1]
          .setTitle('🗑️ In-Game Title Removed')[cite: 1]
          .setDescription(`Successfully removed the custom title from **${displayName}** (\`@${userId}\`).`)[cite: 1]
          .setTimestamp();[cite: 1]

        await interaction.editReply({ embeds: [titleEmbed] });[cite: 1]
      } catch (error) {[cite: 1]
        console.error('Failed to remove title from Firebase:', error);[cite: 1]
        await interaction.editReply({ content: '❌ Failed to remove custom title from Firebase.' });[cite: 1]
      }[cite: 1]
    }

    else if (commandName === 'syncban') {[cite: 1]
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {[cite: 1]
        return interaction.reply({ content: '❌ Administrator permission required.', ephemeral: true });[cite: 1]
      }

      await interaction.deferReply();[cite: 1]
      const discordUser = interaction.options.getUser('target');[cite: 1]
      const robloxId = interaction.options.getString('robloxid');[cite: 1]
      const reason = interaction.options.getString('reason') || 'No reason provided';[cite: 1]

      try {[cite: 1]
        await interaction.guild.members.ban(discordUser.id, { reason: reason });[cite: 1]
      } catch (e) {[cite: 1]
        console.log('Failed to ban from Discord server: ' + e);[cite: 1]
      }

      await fetch(`https://donate-modded-2b27d-default-rtdb.firebaseio.com/BannedPlayers/${robloxId}.json`, {[cite: 1]
        method: 'PUT',[cite: 1]
        headers: { 'Content-Type': 'application/json' },[cite: 1]
        body: JSON.stringify({[cite: 1]
          bannedBy: interaction.user.tag,[cite: 1]
          reason: reason,[cite: 1]
          timestamp: Date.now(),[cite: 1]
          discordId: discordUser.id[cite: 1]
        })[cite: 1]
      });[cite: 1]

      const banEmbed = new EmbedBuilder()[cite: 1]
        .setColor('#ff0000')[cite: 1]
        .setTitle('🚨 GLOBAL SECURITY BAN EXECUTED')[cite: 1]
        .setDescription(`The hammer has dropped. User has been eradicated across all platforms.`)[cite: 1]
        .addFields([cite: 1]
          { name: 'Discord User', value: `${discordUser.tag} (${discordUser.id})`, inline: true },[cite: 1]
          { name: 'Roblox ID', value: `${robloxId}`, inline: true },[cite: 1]
          { name: 'Reason', value: reason, inline: false }[cite: 1]
        )[cite: 1]
        .setTimestamp();[cite: 1]

      await interaction.editReply({ embeds: [banEmbed] });[cite: 1]
    }

    else if (commandName === 'giveaway') {[cite: 1]
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {[cite: 1]
        return interaction.reply({ content: '❌ Administrator permission required.', ephemeral: true });[cite: 1]
      }

      const prize = interaction.options.getString('prize');[cite: 1]
      const winnerCount = interaction.options.getInteger('winners');[cite: 1]
      const durationMinutes = interaction.options.getInteger('duration');[cite: 1]
      const endTime = Date.now() + (durationMinutes * 60 * 1000);[cite: 1]
      const giveawayId = `gw_${Date.now()}`;[cite: 1]

      await fetch(`https://donate-modded-2b27d-default-rtdb.firebaseio.com/ActiveGiveaways/${giveawayId}.json`, {[cite: 1]
        method: 'PUT',[cite: 1]
        headers: { 'Content-Type': 'application/json' },[cite: 1]
        body: JSON.stringify({ prize, participants: {}, status: 'active', endTime })[cite: 1]
      });[cite: 1]

      const enterButton = new ButtonBuilder()[cite: 1]
        .setCustomId(`enter_gw_${giveawayId}`)[cite: 1]
        .setLabel('🎉 ENTER GIVEAWAY')[cite: 1]
        .setStyle(ButtonStyle.Success);[cite: 1]

      const row = new ActionRowBuilder().addComponents(enterButton);[cite: 1]

      const embed = new EmbedBuilder()[cite: 1]
        .setColor('#00ffcc')[cite: 1]
        .setTitle('🎉 EPIC GAME GIVEAWAY 🎉')[cite: 1]
        .setDescription(`Prize: **${prize}**\nWinners: **${winnerCount}**\nEnds: <t:${Math.floor(endTime / 1000)}:R>\n\nClick the button below to secure your entry!`)[cite: 1]
        .setFooter({ text: `Hosted by ${interaction.user.tag}` })[cite: 1]
        .setTimestamp(endTime);[cite: 1]

      const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });[cite: 1]

      setTimeout(async () => {[cite: 1]
        try {[cite: 1]
          const res = await fetch(`https://donate-modded-2b27d-default-rtdb.firebaseio.com/ActiveGiveaways/${giveawayId}/participants.json`);[cite: 1]
          const participantsObj = await res.json();[cite: 1]

          if (!participantsObj) {[cite: 1]
            return msg.edit({ content: `❌ Giveaway for **${prize}** ended, but nobody entered!`, embeds: [], components: [] });[cite: 1]
          }

          const userIds = Object.keys(participantsObj);[cite: 1]
          const winners = [];[cite: 1]

          for (let i = 0; i < Math.min(winnerCount, userIds.length); i++) {[cite: 1]
            const randomIndex = Math.floor(Math.random() * userIds.length);[cite: 1]
            winners.push(participantsObj[userIds[randomIndex]].username);[cite: 1]
            userIds.splice(randomIndex, 1);[cite: 1]
          }

          const endedEmbed = new EmbedBuilder()[cite: 1]
            .setColor('#ff007f')[cite: 1]
            .setTitle('🎉 GIVEAWAY CONCLUDED 🎉')[cite: 1]
            .setDescription(`Prize: **${prize}**\n\n👑 **Winner(s):**\n${winners.map(w => `• ${w}`).join('\n')}`)[cite: 1]
            .setTimestamp();[cite: 1]

          await msg.edit({ embeds: [endedEmbed], components: [] });[cite: 1]
          await interaction.followUp({ content: `🎊 Congratulations ${winners.map(w => `@${w}`).join(', ')}! You won **${prize}**!` });[cite: 1]
        } catch (err) {[cite: 1]
          console.error('Giveaway timer error:', err);[cite: 1]
        }[cite: 1]
      }, durationMinutes * 60 * 1000);[cite: 1]
    }

    else if (commandName === 'poll') {[cite: 1]
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {[cite: 1]
        return interaction.reply({ content: '❌ Administrator permission required.', ephemeral: true });[cite: 1]
      }

      const question = interaction.options.getString('question');[cite: 1]
      const opt1 = interaction.options.getString('option1');[cite: 1]
      const opt2 = interaction.options.getString('option2');[cite: 1]
      const pollId = `poll_${Date.now()}`;[cite: 1]

      await fetch(`https://donate-modded-2b27d-default-rtdb.firebaseio.com/Polls/${pollId}.json`, {[cite: 1]
        method: 'PUT',[cite: 1]
        headers: { 'Content-Type': 'application/json' },[cite: 1]
        body: JSON.stringify({ question, opt1, opt2, votes1: 0, votes2: 0, voters: {} })[cite: 1]
      });[cite: 1]

      const btn1 = new ButtonBuilder().setCustomId(`vote_${pollId}_1`).setLabel(opt1).setStyle(ButtonStyle.Primary);[cite: 1]
      const btn2 = new ButtonBuilder().setCustomId(`vote_${pollId}_2`).setLabel(opt2).setStyle(ButtonStyle.Secondary);[cite: 1]
      const row = new ActionRowBuilder().addComponents(btn1, btn2);[cite: 1]

      const embed = new EmbedBuilder()[cite: 1]
        .setColor('#3498db')[cite: 1]
        .setTitle('📊 COMMUNITY VOTE / POLL')[cite: 1]
        .setDescription(`**${question}**\n\n🟢 **[1]** ${opt1} (0 votes)\n🔵 **[2]** ${opt2} (0 votes)`)[cite: 1]
        .setFooter({ text: `Poll ID: ${pollId}` })[cite: 1]
        .setTimestamp();[cite: 1]

      await interaction.reply({ embeds: [embed], components: [row] });[cite: 1]
    }
  } catch (error) {[cite: 1]
    console.error('Error handling command:', error);[cite: 1]
    if (!interaction.replied && !interaction.deferred) {[cite: 1]
      await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true }).catch(() => {});[cite: 1]
    }
  }
});

// Handle Ticket Dropdown[cite: 1]
client.on('interactionCreate', async interaction => {[cite: 1]
  if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_category_select') {[cite: 1]
    await interaction.deferReply({ ephemeral: true });[cite: 1]

    const categoryValue = interaction.values[0];[cite: 1]
    const guild = interaction.guild;[cite: 1]
    const member = interaction.member;[cite: 1]

    const existingChannel = guild.channels.cache.find(c => c.name === `ticket-${member.user.username.toLowerCase()}`);[cite: 1]
    if (existingChannel) {[cite: 1]
      return interaction.editReply({ content: `❌ You already have an active ticket open here: ${existingChannel}` });[cite: 1]
    }

    try {[cite: 1]
      const ticketChannel = await guild.channels.create({[cite: 1]
        name: `ticket-${member.user.username}`,[cite: 1]
        type: ChannelType.GuildText,[cite: 1]
        permissionOverwrites: [[cite: 1]
          { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },[cite: 1]
          { id: member.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },[cite: 1]
          { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },[cite: 1]
        ],[cite: 1]
      });[cite: 1]

      await interaction.editReply({ content: `✅ Your ticket has been created! Head over to ${ticketChannel}` });[cite: 1]

      const welcomeEmbed = new EmbedBuilder()[cite: 1]
        .setColor('#7289da')[cite: 1]
        .setTitle(`Ticket: ${categoryValue.replace('_', ' ').toUpperCase()}`)[cite: 1]
        .setDescription(`Hello ${member}, thank you for reaching out.\n\nPlease describe your issue in detail, and a staff member will be with you shortly.`);[cite: 1]

      const closeButton = new ActionRowBuilder().addComponents([cite: 1]
        new ButtonBuilder()[cite: 1]
          .setCustomId('close_ticket')[cite: 1]
          .setLabel('🔒 Close Ticket')[cite: 1]
          .setStyle(ButtonStyle.Danger)[cite: 1]
      );[cite: 1]

      await ticketChannel.send({ embeds: [welcomeEmbed], components: [closeButton] });[cite: 1]
    } catch (error) {[cite: 1]
      console.error('Failed to create ticket channel:', error);[cite: 1]
      await interaction.editReply({ content: '❌ Failed to create your ticket channel.' });[cite: 1]
    }
  }
});

client.login(process.env.TOKEN);[cite: 1]
