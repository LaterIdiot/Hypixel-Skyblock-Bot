// module that allows dotenv files to be read
require("dotenv").config();

// loads the necessary node modules and refrences necessary files
const fs = require("fs");
const Discord = require("discord.js");
const { prefix } = require("./config.json");

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync("./commands").filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

// sends an output to console when bot is ready
client.once("ready", () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", (message) => {
	// exits the function if the message doesn't start with prefix or if the message is sent by a bot
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	// takes out the prefix for processing and stores the rest
	const args = message.content.slice(prefix.length).trim().split(" ");
	// takes out the first argument since it's a command and stores it
    const commandName = args.shift().toLowerCase();

	// if there is a command then continue
	if (!client.commands.has(commandName)) return;

	const command = client.commands.get(commandName);

	if (command.args && !args.length) {
		return message.channel.send(`You didn't provide any arguments, ${message.author}!`);
	}
	// does the command exist if not send an error message
	try {
		command.execute(message, args);
	} catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command!');
	}
});

// log's in the bot
client.login(process.env.BotToken);
