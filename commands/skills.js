const { Client } = require('@zikeji/hypixel');
const hypixel = new Client(process.env.HypixelAPIKey);
const { find } = require('../uuid');

module.exports = {
	name: 'skills',
	description: 'Sends Hypixel Skyblock skills info to Discord.',
	async execute(message, args=['LaterIdiot']) {
		console.log(await find(args[0]));
	}
};
