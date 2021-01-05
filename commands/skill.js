const { Client } = require('@zikeji/hypixel');
const hypixel = new Client(process.env.HypixelAPIKey);
const { uuid } = require('../uuid');

module.exports = {
	name: 'skill',
	cooldown: 5,
	description: 'Sends Hypixel Skyblock skills info to Discord.',
	guildOnly: false,
	args: true,
	usage: '<username> [profile]',
	async execute(message, args) {
		console.log(await uuid(args[0]));
	}
};
