const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axl = require("app-xbox-live");
const { Authflow: PrismarineAuth, Titles } = require('prismarine-auth');
const algorithm = 'aes-256-cbc';
const secretKey = 'YYujWJY7xXXHpOqJut2m5CPyeBTdkYSp';
const config = require('../../data/discord/config.json');

function decrypt(text) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("xscreenshots")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setDescription("Display Xbox user's screenshots.")
        .addStringOption(option =>
            option.setName("gamertag")
                .setDescription("Enter the gamertag to search for")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("amount")
                .setDescription("Number of screenshots to display (default is 50)")
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.reply({ embeds: [
            new EmbedBuilder()
                .setTitle('Frosted Loading')
                .setDescription(`Checking data, this may take a second depending on how much is been handled.`)
                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                .setThumbnail(config.embeds.footerurl)
                .setColor(config.embeds.color)
        ] 
        })
        try {
            await interaction.deferReply(); // Defer the reply to avoid timeouts

            const user = interaction.user.id;
           
            const authflow = new PrismarineAuth(undefined, `./auth`, { 
                flow: "live", 
                authTitle: Titles.MinecraftNintendoSwitch, 
                deviceType: "Nintendo", 
                doSisuAuth: true 
            });
            const info = await authflow.getXboxToken(); 
            const xl = new axl.Account(`XBL3.0 x=${info.userHash};${info.XSTSToken}`);
            const gamertag = interaction.options.getString("gamertag");
            const amount = interaction.options.getInteger("amount") || 50; // Default to 50 if no amount specified

            // Find the user by gamertag
            const searchResults = await xl.people.find(gamertag, 1);

            if (!searchResults || !searchResults.people || searchResults.people.length === 0) {
                await interaction.editReply({ content: `No users found matching the gamertag "${gamertag}".`, ephemeral: true });
                return;
            }

            const selectedUser = searchResults.people[0];
            const xuidToSearch = selectedUser.xuid;

            // Fetch screenshots
            const screenshotsResult = await xl.people.screenshot.get(xuidToSearch, amount);
            const screenshots = screenshotsResult.screenshots || [];

            if (screenshots.length === 0) {
                await interaction.editReply({ content: `No screenshots found for user "${gamertag}".`, ephemeral: true });
                return;
            }

            const pageSize = 3; 
            let currentPage = 0; 
            const totalPages = Math.ceil(screenshots.length / pageSize);

            const createEmbedsForPage = (page) => {
                const start = page * pageSize;
                const end = Math.min(start + pageSize, screenshots.length);
                const embeds = [];

                for (let i = start; i < end; i++) {
                    const screenshot = screenshots[i];

                    const screenshotEmbed = new EmbedBuilder()
                        .setColor('#70629E')
                        .setTitle(`Screenshot ${i + 1}`)
                        .setImage(screenshot.url || null) 
                        .setFooter({ text: 'Capri Sun Xbox' });

                    embeds.push(screenshotEmbed);
                }

                return embeds;
            };

            const updateButtons = (locked = false) => {
                const buttons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('back')
                            .setLabel('Back')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(locked || currentPage === 0)
                            .setEmoji('◀️'),
                        new ButtonBuilder()
                            .setCustomId('stop')
                            .setLabel('Stop')
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji('🛑'),
                        new ButtonBuilder()
                            .setCustomId('forward')
                            .setLabel('Forward')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(locked || currentPage === totalPages - 1)
                            .setEmoji('▶️')
                    );
                return buttons;
            };

            const embeds = createEmbedsForPage(currentPage);
            const buttons = updateButtons();

            await interaction.editReply({ embeds, components: [buttons], ephemeral: false });

            const filter = i => i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'back') {
                    if (currentPage > 0) currentPage--;
                } else if (i.customId === 'forward') {
                    if (currentPage < totalPages - 1) currentPage++;
                } else if (i.customId === 'stop') {
                    collector.stop();
                    const finalEmbeds = createEmbedsForPage(currentPage);
                    await i.update({ embeds: finalEmbeds, components: [] });
                    return;
                }

                const newEmbeds = createEmbedsForPage(currentPage);
                const newButtons = updateButtons();

                await i.update({ embeds: newEmbeds, components: [newButtons] });
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply({ components: [] });
                }
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: "There was an error while executing this command!", ephemeral: true });
        }
    }
};
