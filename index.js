const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionFlagsBits } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('ready', () => {
    log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        if (commandName === 'ticketpanel') {
            const channel = interaction.options.getChannel('target_channel') || interaction.channel;

            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle('❓ Support')
                .setDescription('Do you have any questions regarding the server or game?\nCreate a ticket here and our moderators will help you!\n\nPlease keep in mind that creating joke tickets is against the rules.')
                .setImage('https://chatgpt.com/backend-api/estuary/content?id=file_00000000285c8246935b2ec07f2b9ada&ts=495901&p=fs&cid=1&sig=aa4e0be7854f5bea74475498afb4518c4e69a0ae780d5a7193b94727bc88b626&v=0')
                .setFooter({ text: '[💰] Puataun’s Utilities' });

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
    }

    if (interaction.isButton() && interaction.customId === 'open_ticket_modal') {
        const modal = new ModalBuilder()
            .setCustomId('ticket_modal')
            .setTitle('Create a Support Ticket');

        const reasonInput = new TextInputBuilder()
            .setCustomId('help_reason')
            .setLabel('What do you need help with?')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const issueInput = new TextInputBuilder()
            .setCustomId('issue_question')
            .setLabel('Describe your issue or question')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(reasonInput),
            new ActionRowBuilder().addComponents(issueInput)
        );

        return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'ticket_modal') {
        await interaction.deferReply({ ephemeral: true });

        const helpReason = interaction.fields.getTextInputValue('help_reason');
        const issueQuestion = interaction.fields.getTextInputValue('issue_question');

        const guild = interaction.guild;
        const channelName = `ticket-${interaction.user.username}`.toLowerCase();

        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: guild.id,
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
            .setImage('https://chatgpt.com/backend-api/estuary/content?id=file_00000000285c8246935b2ec07f2b9ada&ts=495901&p=fs&cid=1&sig=aa4e0be7854f5bea74475498afb4518c4e69a0ae780d5a7193b94727bc88b626&v=0')
            .setTimestamp();

        await ticketChannel.send({
            content: `<@${interaction.user.id}>`,
            embeds: [ticketEmbed]
        });

        return interaction.editReply({ content: `✅ Your ticket has been created: <#${ticketChannel.id}>` });
    }
});

client.login('YOUR_BOT_TOKEN');
