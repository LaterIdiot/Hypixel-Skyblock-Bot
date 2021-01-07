const Discord = require("discord.js");
const { Client } = require("@zikeji/hypixel");
const hypixel = new Client(process.env.HYPIXEL_API_KEY);
const { findPlayerData } = require("../helpers/playerData");
const { leveling_xp, default_skill_caps, runecrafting_xp, dungeoneering_xp } = require("../constants/leveling");

module.exports = {
	name: "skill",
	cooldown: 5,
	description: "Sends Hypixel Skyblock skills info to Discord.",
	guildOnly: false,
	args: true,
	usage: "<username> [-p--<profilename>]",
	async execute(message, args) {
		// gets required information to run the command and also to access Hypixel Api
		const optionPrefixes = ["-p--"];
		const playerData = await findPlayerData(args.shift());
		const username = playerData.name;
		const uuid = playerData.id;

		if (!uuid) return;

		// finds profiles
		const profiles = await hypixel.skyblock.profiles.uuid(uuid)
			.then((response) => {return response})
			.catch((err) => console.error("HypixelAPIError:", err));

		if (!profiles) return;

		profiles.sort((a, b) => b.members[uuid].last_save - a.members[uuid].last_save)

		let defaultProfile = profiles[0].members[uuid];
		let selectedProfileIndex = 0;

		if (args.length > 0) {
			if (args[0].startsWith(optionPrefixes[0])) {
				const profileName = (args[0].replace(optionPrefixes[0], "")).toLowerCase();

				for (let i = 0; i < profiles.length; i++) {
					if (profiles[i].cute_name.toLowerCase() === profileName) {
						defaultProfile = profiles[i].members[uuid];
						selectedProfileIndex = i;
						break;
					};
				};
			};
		};

		// calculates skill level and gives remaining xp after calculation
		let skillsTotalXp = 0;
		let skillsActualTotalXp = 0;
		let skillsTotalMaxXp = 0;
		let skillsTotalLevel = 0;

		function findSkillLevel(xp, skillCap, type = "leveling") {
			const xpConst = xp;
			let level = 1;
			let totalXp = 0;
			
			if (type === "dungeoneering") {
				for (; (level <= 50) && ((xp - dungeoneering_xp[level]) >= 0); level++) {
					xp -= dungeoneering_xp[level];
				};

				for (let i = 1; i <= skillCap; i++) {
					totalXp += dungeoneering_xp[i];
				}
			} else if (type === "runecrafting") {
				for (; (level <= skillCap) && ((xp - runecrafting_xp[level]) >= 0); level++) {
					xp -= runecrafting_xp[level];
				};

				for (let i = 1; i <= skillCap; i++) {
					totalXp += runecrafting_xp[i];
				}
			} else {
				for (; (level <= skillCap) && ((xp - leveling_xp[level]) >= 0); level++) {
					xp -= leveling_xp[level];
				};

				for (let i = 1; i <= skillCap; i++) {
					totalXp += leveling_xp[i];
				}

				if (type !== "carpentry") {
					if (skillCap !== level - 1) {
						skillsTotalXp += xpConst;
					} else {
						skillsTotalXp += totalXp;
					};

					skillsActualTotalXp += xpConst;
					skillsTotalMaxXp += totalXp;
					skillsTotalLevel += level - 1;
				};
			};
			level--;

			return {level, xp, totalXp};
		};

		const farmingLevel = findSkillLevel(defaultProfile.experience_skill_farming, default_skill_caps.farming + (defaultProfile.jacob2.perks.farming_level_cap || 0));
		const miningLevel = findSkillLevel(defaultProfile.experience_skill_mining || 0, default_skill_caps.mining);
		const combatLevel = findSkillLevel(defaultProfile.experience_skill_combat || 0, default_skill_caps.combat);
		const foragingLevel = findSkillLevel(defaultProfile.experience_skill_foraging || 0, default_skill_caps.foraging);
		const fishingLevel = findSkillLevel(defaultProfile.experience_skill_fishing || 0, default_skill_caps.fishing);
		const enchantingLevel = findSkillLevel(defaultProfile.experience_skill_enchanting || 0, default_skill_caps.enchanting);
		const alchemyLevel = findSkillLevel(defaultProfile.experience_skill_alchemy || 0, default_skill_caps.alchemy);
		const tamingLevel = findSkillLevel(defaultProfile.experience_skill_taming || 0, default_skill_caps.taming);
		const carpentryLevel = findSkillLevel(defaultProfile.experience_skill_carpentry || 0, default_skill_caps.carpentry, "carpentry");
		const runecraftingLevel = findSkillLevel(defaultProfile.experience_skill_runecrafting || 0, default_skill_caps.runecrafting, "runecrafting");

		const skillsAverage =  skillsTotalLevel / 8;

		const skillEmbed = new Discord.MessageEmbed()
			.setColor("#a60000")
			.setTitle(`Skills - ${username} (${profiles[selectedProfileIndex].cute_name})`)
			.setDescription(`Skills information for ${username} from ${profiles[selectedProfileIndex].cute_name} profile:`)
			.addFields(
				{ name: ":beginner: Skills", value: `Average Level: ${skillsAverage.toFixed(2)}\nProgress: ${((skillsTotalXp/skillsTotalMaxXp) * 100).toFixed(2)}%\nTotal XP: ${skillsTotalXp.toFixed()}` }
			);

		message.reply(skillEmbed);
	}
};
