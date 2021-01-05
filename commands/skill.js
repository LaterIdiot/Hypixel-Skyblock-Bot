const { Client } = require("@zikeji/hypixel");
const hypixel = new Client(process.env.HYPIXEL_API_KEY);
const { findUuid } = require("../uuid");
const fetch = require("node-fetch");
const { SkyBlock } = require("@zikeji/hypixel/dist/methods/skyblock");
const { SkyBlockProfiles } = require("@zikeji/hypixel/dist/methods/skyblock/profiles");

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

		console.log(uuid);

		if (!uuid) return;

		const profiles = await hypixel.player.uuid(uuid)
			.then((response) => {return response.stats.SkyBlock.profiles})
			.catch((err) => console.log(`${username} has no SkyBlock Profiles`));

		if (!profiles) return;

		let lastsaveSorted = [];
		let profileLastsave = {};

		for (let x in profiles) {
			const lastsave = await hypixel.skyblock.profile(x)
				.then(data => {return data.members[uuid].last_save})
				.catch(err => console.error(err));

			lastsaveSorted.push(lastsave);
			profileLastsave[lastsave.toString()] = x;
		};

		lastsaveSorted.sort((a, b) => {return b - a});

		console.log(profileLastsave);
	}
};
