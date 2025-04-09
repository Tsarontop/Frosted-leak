const fs = require('fs');
const path = require('path');
const prefix = '!';
const allowedUserIds = new Set([
  '1307650846888169483', //tsar
  '1170112690279165974' , // NRC
  '', 
  '', 
  '' ,
  '',
]) 


module.exports = {
  name: 'messageCreate',
  execute(message) {
    if (!message.content.startsWith(prefix) || message.author.bot || !allowedUserIds.has(message.author.id)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const commandPath = path.join(__dirname, '..', 'prefix', `${commandName}.js`);
    if (!fs.existsSync(commandPath)) return;

    const command = require(commandPath);
    try {
      command.run(message, args);
    } catch (error) {
      console.error(error);
      message.reply('There was an error trying to execute that command!');
    }
  }
};
