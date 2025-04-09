const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SelectMenuBuilder } = require("discord.js");
const fs = require("node:fs");
const config = require('../../data/discord/config.json')
const colors = require('../../data/handles/colors.js');
const path = require ('path')
module.exports = {
    data: new SlashCommandBuilder()
        .setName("unlink")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setDescription("Delete all personal data stored by frosted.")
        .addStringOption(option =>
            option.setName('acc')
                .setDescription('The device to spoof as')
                .setRequired(true)
                .addChoices(
                    { name: 'Account 1', value: '1' },
                    { name: 'Account 2', value: '2' },
                    { name: 'Account 3', value: '3' },
                )
        ),
    execute: async (interaction) => {
        interaction.client.on('error', console.error);
        const acc = interaction.options.getString('acc')
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("Frosted Auth")
                    .setDescription(`Checking data, this may take a second depending on how much is been handled.`)
                    .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                    .setThumbnail(config.embeds.footerurl)
                    .setColor(config.embeds.color)
            ],
            components: [],
        });


        let accountsdata;
        accountsdata = JSON.parse(fs.readFileSync(path.join('./data/client/users.json')));

        if (!fs.existsSync(`./data/client/frosted/${interaction.user.id}/profile${acc}`)) {
            return await interaction.editReply({ embeds: [
                new EmbedBuilder()
                .setTitle("Frosted Error")
                .setDescription("You have accepted the tos but have not done **/link** to link a xbox account?")
                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                .setThumbnail(config.embeds.footerurl)
                .setColor(config.embeds.color)
            ] 
            });
        }

        let data = {};
        if (fs.existsSync('./data/client/users.json')) {
            data = JSON.parse(fs.readFileSync('./data/client/users.json', 'utf8'));
            if(!data[interaction.user.id]?.linked) {
                console.log('herm bug !')
               
            }
            if (fs.existsSync(`./data/client/frosted/${interaction.user.id}/profile${acc}`)) {
                fs.rmSync(`./data/client/frosted/${interaction.user.id}/profile${acc}`, { recursive: true, force: true });
            }
            data[interaction.user.id].xbox[`xbox${acc}`] ={
                linked: false
            }
            fs.writeFileSync('./data/client/users.json', JSON.stringify(data, null, 4));
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Frosted Auth")
                        .setDescription(`Your account has been unlinked from frosteds database. We hope you had fun, tos status stays the same for legal reasons.`)
                        .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                        .setThumbnail(config.embeds.footerurl)
                        .setColor(config.embeds.color)
                ],
                components: [],
            });
        } else {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Frosted Auth")
                        .setDescription(`yeah i have no idea how you got this, this is not possible :(`)
                        .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                        .setThumbnail(config.embeds.footerurl)
                        .setColor(config.embeds.color)
                ],
                components: [],
            });
        }
    }
}
