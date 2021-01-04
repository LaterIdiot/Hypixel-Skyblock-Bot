// module that allows dotenv files to be read
require('dotenv').config();

// refrences discord.js module
const Discord = require('discord.js');
const client = new Discord.Client();
const {prefix} = require('./config.json')

// sends an output to console when bot is ready
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', message => {
  // exits the function if the message doesn't start with prefix or if the message is sent by a bot
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  // takes out the prefix for processing and stores the rest
  const args = message.content.slice(prefix.length).trim().split(' ');
  // takes out the first argument since it's a command and stores it
  const command = args.shift().toLowerCase();
  
  console.log(args)
});

// log's in the bot
client.login(process.env.BotToken);