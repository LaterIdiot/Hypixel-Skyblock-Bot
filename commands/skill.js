const { Client } = require("@zikeji/hypixel");
const hypixel = new Client(process.env.HYPIXEL_API_KEY);
const { findUuid } = require("../uuid");
const fetch = require("node-fetch");

module.exports = {
	name: "skill",
	cooldown: 5,
	description: "Sends Hypixel Skyblock skills info to Discord.",
	guildOnly: false,
	args: true,
	usage: "<username> [-p|profilename] [-s|skillname]",
	async execute(message, args) {
		const username = args[0];
		const uuid = await findUuid(username);

		if (!uuid) return;

		const profiles = await hypixel.player
			.uuid(uuid)
			.then((response) => response.stats.SkyBlock.profiles)
			.catch(() => console.log(`${username} has no SkyBlock Profiles`));

		if (!profiles) return;
	},
};
