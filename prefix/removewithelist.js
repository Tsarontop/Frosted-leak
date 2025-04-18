const fs = require('fs');
const path = require('path');

const whitelistFilePath = path.join(__dirname, '..', 'data', 'client', 'whitelist.json');

// Funktion zum Laden der Whitelist
function loadWhitelist() {
    try {
        return JSON.parse(fs.readFileSync(whitelistFilePath, 'utf-8'));
    } catch (error) {
        console.error('Error loading whitelist file:', error);
        return [];
    }
}

// Funktion zum Speichern der Whitelist
function saveWhitelist(whitelist) {
    try {
        fs.writeFileSync(whitelistFilePath, JSON.stringify(whitelist, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving whitelist file:', error);
    }
}

exports.run = async (message, args) => {
    if (args.toString().trim() === '') {
        return message.reply('`!removewhitelist` is a command to remove a Realm code from the whitelist.\n\nSyntax: !removewhitelist <realm-code>');
    }

    const realmCode = args.toString().trim();
    const whitelist = loadWhitelist();

    // Überprüfen, ob der Code in der Whitelist enthalten ist
    if (!whitelist.includes(realmCode)) {
        return message.reply('This Realm code is not in the whitelist!');
    }

    // Entferne den Realm-Code aus der Whitelist
    const updatedWhitelist = whitelist.filter(code => code !== realmCode);
    saveWhitelist(updatedWhitelist);

    message.reply(`Successfully removed **${realmCode}** from the whitelist!`);
};
