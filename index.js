const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits, ChannelType } = require('discord.js');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is alive!');
});

app.listen(PORT, () => {
  console.log(`Web server is running on port ${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildInvites
  ],
  presence: {
    status: 'online',
    activities: [{
      name: 'Khaby\'s Utilities',
      type: 0
    }]
  }
});

const ALLOWED_ROLE_ID = '1530637234317820095';

const commands = [
  new SlashCommandBuilder().setName('ticketpanel').setDescription('Sends the support ticket panel').addChannelOption(o => o.setName('target_channel').setDescription('Channel to send panel').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
].map(command => command.toJSON());

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  const activeToken = process.env.TOKEN2 || process.env.TOKEN;
  const rest = new REST({ version: '10' }).setToken(activeToken);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('Successfully registered global commands.');
  } catch (error) {
    console.error('Command registration error:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (interaction.guild) {
    const member = interaction.member || await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    if (!member || !member.roles.cache.has(ALLOWED_ROLE_ID)) {
      return interaction.reply({ content: '❌ You do not have permission to use this bot.', ephemeral: true });
    }
  }

  if (interaction.isButton()) {
    const customId = interaction.customId;

    if (customId === 'open_ticket_modal') {
      const modal = new ModalBuilder()
        .setCustomId('ticket_submission_modal')
        .setTitle('User Support');

      const descInput = new TextInputBuilder()
        .setCustomId('ticket_description')
        .setLabel('What do you need help with?')
        .setPlaceholder('Be descriptive')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const issueInput = new TextInputBuilder()
        .setCustomId('ticket_issue')
        .setLabel('What is your issue/question?')
        .setPlaceholder('Ask away!')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(descInput),
        new ActionRowBuilder().addComponents(issueInput)
      );

      return interaction.showModal(modal);
    }
    return;
  }

  if (interaction.isModalSubmit() && interaction.customId === 'ticket_submission_modal') {
    const helpReason = interaction.fields.getTextInputValue('ticket_description');
    const issueQuestion = interaction.fields.getTextInputValue('ticket_issue');

    await interaction.deferReply({ ephemeral: true });

    try {
      const ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
          },
        ],
      });

      const ticketEmbed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle(`Ticket: ${interaction.user.tag}`)
        .setDescription(`**Help with:** ${helpReason}\n**Issue/Question:** ${issueQuestion}`)
        .setTimestamp();

      await ticketChannel.send({ content: `${interaction.user} Support will be with you shortly!`, embeds: [ticketEmbed] });

      return interaction.editReply({
        content: `✅ Your ticket channel has been created successfully: ${ticketChannel}!`,
      });
    } catch (err) {
      return interaction.editReply({
        content: `❌ Failed to create ticket channel. Make sure the bot has 'Manage Channels' permissions!`,
      });
    }
  }

  if (!interaction.isChatInputCommand()) return;
  const { commandName } = interaction;

  if (commandName === 'ticketpanel') {
    const channel = interaction.options.getChannel('target_channel');

    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('❓ Support')
      .setDescription('Do you have any questions regarding the server or game?\nCreate a ticket here and our moderators will help you!\n\nPlease keep in mind that creating joke tickets is against the rules.')
      .setFooter({ text: 'Official Ticket Tool Partner' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_ticket_modal')
        .setLabel('Create ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📥')
    );

    await channel.send({ embeds: [embed], components: [row] });
    return interaction.reply({ content: '✅ Ticket panel sent successfully!', ephemeral: true });
  }
});

client.login(process.env.TOKEN2 || process.env.TOKEN);
