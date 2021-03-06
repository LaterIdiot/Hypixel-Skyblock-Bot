const Discord = require("discord.js");
const { Client } = require("@zikeji/hypixel");
const hypixel = new Client(process.env.HYPIXEL_API_KEY);
const { findPlayerData } = require("../helpers/playerData");
const { leveling_xp, default_skill_caps, runecrafting_xp, dungeoneering_xp } = require("../constants/leveling");
const numberFormat = new Intl.NumberFormat();

module.exports = {
	name: "skill",
	cooldown: 5,
	description: "Sends Hypixel Skyblock skills info to Discord.",
	guildOnly: false,
	args: true,
	usage: "<username> [profile]",
	async execute(message, args) {
		let loadingEmbed = new Discord.MessageEmbed()
			.setColor("#5e91ff")
			.setTitle("Loading...")
			.setDescription(`Loading Player's Player Data`)
			.setTimestamp();

		let embedMsg = await message.channel.send(`${message.author}`, loadingEmbed)

		// gets required information to run the command and also to access Hypixel Api
		const optionPrefixes = ["-p--"];
		const playerData = await findPlayerData(args.shift());

		if (!playerData) {
			const playerDataErrorEmbed = new Discord.MessageEmbed()
				.setColor("#ff0000")
				.setTitle("Error:")
				.setDescription(`Couldn't Find Player's UUID:\nThe username that you entered is invalid.`)
				.setTimestamp();

			return embedMsg.edit(playerDataErrorEmbed);
		};

		const username = playerData.name;
		const uuid = playerData.id;

		loadingEmbed.description = `Loading ${username}'s Skills`;

		embedMsg.edit(loadingEmbed)

		// finds profiles
		const profiles = await hypixel.skyblock.profiles.uuid(uuid)
			.then((response) => {return response})
			.catch(() => {return null});

		if (!profiles) {
			profilesErrorEmbed = new Discord.MessageEmbed()
				.setColor("#ff0000")
				.setTitle("Error:")
				.setDescription(`Couldn't Find ${username}'s Profiles:\n${username} doesn't seem to have any SkyBlock Profiles.`)
				.setTimestamp();
			
			return embedMsg.edit(profilesErrorEmbed);
		};

		profiles.sort((a, b) => b.members[uuid].last_save - a.members[uuid].last_save)

		let defaultProfile = profiles[0].members[uuid];
		let selectedProfileIndex = 0;

		if (args.length > 0) {
			let profileName = args[0].toLowerCase();

			const profileNameErrorEmbed = new Discord.MessageEmbed()
				.setColor("#ff0000")
				.setTitle("Error:")
				.setDescription(`Couldn't Find ${username}'s ${profileName} Profile:\n${username} doesn't seem to have a profile named ${profileName}.`)
				.setTimestamp();

			if (profileName === "select") {
				if (profiles.length > 1) {
					let profilesCuteNameList = [];

					for (let i = 0; i < profiles.length; i++) {
						profilesCuteNameList.push(`${i + 1} > ${profiles[i].cute_name}`);
					};

					const selectProfileEmbed = new Discord.MessageEmbed()
						.setColor("#5e91ff")
						.setTitle("Select a Profile")
						.setDescription(`Select a profile by typing the profile name or by its corresponding profile number:\`\`\`\n${profilesCuteNameList.join("\n")}\`\`\``)
						.setTimestamp();

					const filter = response => {
						return response.author.id === message.author.id;
					};

					await embedMsg.edit(selectProfileEmbed);

					const userResponse = await message.channel.awaitMessages(filter, { max: 1, time: 20000, errors: ['time']})
						.then(collected => {
							if (parseInt(collected.first().content) <= profiles.length && parseInt(collected.first().content) > 0) {
								profileName = profiles[parseInt(collected.first().content) - 1].cute_name.toLowerCase();
								collected.first().delete();
								return null;
							};

							profileName = collected.first().content.toLowerCase();
							profileNameErrorEmbed.description = `Couldn't Find ${username}'s ${profileName} Profile:\n${username} doesn't seem to have a profile named ${profileName}.`;
							collected.first().delete();
							return null;
						})
						.catch(() => {
							const timeOutEmbed = new Discord.MessageEmbed()
								.setColor("#ff0000")
								.setTitle("Timeout Error:")
								.setDescription("You didn't enter a profile name in time.")
								.setTimestamp();

							return embedMsg.edit(timeOutEmbed);
						});

					if (userResponse !== null) return;
				};
			};

			for (let i = 0; i < profiles.length; i++) {
				if (profiles[i].cute_name.toLowerCase() === profileName) {
					defaultProfile = profiles[i].members[uuid];
					selectedProfileIndex = i;
					break;
				} else if (i === profiles.length - 1) {
					return embedMsg.edit(profileNameErrorEmbed);
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
			let percentToNext;
			
			if (type === "dungeoneering") {
				for (; (level <= 50) && ((xp - dungeoneering_xp[level]) >= 0); level++) {
					xp -= dungeoneering_xp[level];
				};

				for (let i = 1; i <= skillCap; i++) {
					totalXp += dungeoneering_xp[i];
				};

				if (skillCap !== level - 1) {
					percentToNext = (xp/dungeoneering_xp[level]) * 100;
				};
			} else if (type === "runecrafting") {
				for (; (level <= skillCap) && ((xp - runecrafting_xp[level]) >= 0); level++) {
					xp -= runecrafting_xp[level];
				};

				for (let i = 1; i <= skillCap; i++) {
					totalXp += runecrafting_xp[i];
				};

				if (skillCap !== level - 1) {
					percentToNext = (xp/runecrafting_xp[level]) * 100;
				};
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
				} else {

				};

				if (skillCap !== level - 1) {
					percentToNext = (xp/leveling_xp[level]) * 100;
				};
			};

			let progress = (xpConst >= totalXp) ? 100 : (xpConst/totalXp) * 100;
			level--;

			return {level, percentToNext, totalXp, skillCap, progress, xpConst};
		};

		const farmingLevel = findSkillLevel(defaultProfile.experience_skill_farming || 0, default_skill_caps.farming + ((defaultProfile.jacob2) ? (defaultProfile.jacob2.perks) ? defaultProfile.jacob2.perks.farming_level_cap || 0 : 0: 0));
		const miningLevel = findSkillLevel(defaultProfile.experience_skill_mining || 0, default_skill_caps.mining);
		const combatLevel = findSkillLevel(defaultProfile.experience_skill_combat || 0, default_skill_caps.combat);
		const foragingLevel = findSkillLevel(defaultProfile.experience_skill_foraging || 0, default_skill_caps.foraging);
		const fishingLevel = findSkillLevel(defaultProfile.experience_skill_fishing || 0, default_skill_caps.fishing);
		const enchantingLevel = findSkillLevel(defaultProfile.experience_skill_enchanting || 0, default_skill_caps.enchanting);
		const alchemyLevel = findSkillLevel(defaultProfile.experience_skill_alchemy || 0, default_skill_caps.alchemy);
		const tamingLevel = findSkillLevel(defaultProfile.experience_skill_taming || 0, default_skill_caps.taming);
		const carpentryLevel = findSkillLevel(defaultProfile.experience_skill_carpentry || 0, default_skill_caps.carpentry, "carpentry");
		const runecraftingLevel = findSkillLevel(defaultProfile.experience_skill_runecrafting || 0, default_skill_caps.runecrafting, "runecrafting");

		const catacombsLevel = findSkillLevel((defaultProfile.dungeons) ? (defaultProfile.dungeons.dungeon_types) ? (defaultProfile.dungeons.dungeon_types.catacombs) ? (defaultProfile.dungeons.dungeon_types.catacombs.experience) ? defaultProfile.dungeons.dungeon_types.catacombs.experience || 0 : 0 : 0 : 0 : 0, Object.keys(dungeoneering_xp).length, "dungeoneering");
		const healerLevel = findSkillLevel((defaultProfile.dungeons) ? (defaultProfile.dungeons.player_classes) ? (defaultProfile.dungeons.player_classes.healer) ? (defaultProfile.dungeons.player_classes.healer.experience) ? defaultProfile.dungeons.player_classes.healer.experience || 0 : 0 : 0 : 0 : 0, Object.keys(dungeoneering_xp).length, "dungeoneering");
		const mageLevel = findSkillLevel((defaultProfile.dungeons) ? (defaultProfile.dungeons.player_classes) ? (defaultProfile.dungeons.player_classes.mage) ? (defaultProfile.dungeons.player_classes.mage.experience) ? defaultProfile.dungeons.player_classes.mage.experience || 0 : 0 : 0 : 0 : 0, Object.keys(dungeoneering_xp).length, "dungeoneering");
		const berserkLevel = findSkillLevel((defaultProfile.dungeons) ? (defaultProfile.dungeons.player_classes) ? (defaultProfile.dungeons.player_classes.berserk) ? (defaultProfile.dungeons.player_classes.berserk.experience) ? defaultProfile.dungeons.player_classes.berserk.experience || 0 : 0 : 0 : 0 : 0, Object.keys(dungeoneering_xp).length, "dungeoneering");
		const archerLevel = findSkillLevel((defaultProfile.dungeons) ? (defaultProfile.dungeons.player_classes) ? (defaultProfile.dungeons.player_classes.archer) ? (defaultProfile.dungeons.player_classes.archer.experience) ? defaultProfile.dungeons.player_classes.archer.experience || 0 : 0 : 0 : 0 : 0, Object.keys(dungeoneering_xp).length, "dungeoneering");
		const tankLevel = findSkillLevel((defaultProfile.dungeons) ? (defaultProfile.dungeons.player_classes) ? (defaultProfile.dungeons.player_classes.tank) ? (defaultProfile.dungeons.player_classes.tank.experience) ? defaultProfile.dungeons.player_classes.tank.experience || 0 : 0 : 0 : 0 : 0, Object.keys(dungeoneering_xp).length, "dungeoneering");

		const skillsAverage =  skillsTotalLevel / 8;

		const skillEmbed = new Discord.MessageEmbed()
			.setColor("#52ba30")
			.setTitle(`Skills - ${username} (${profiles[selectedProfileIndex].cute_name})`)
			.setDescription(`Skills information for ${username} from ${profiles[selectedProfileIndex].cute_name} profile.`)
			.addFields(
				{ name: "🔰 Skills", value: `Average: ${numberFormat.format(skillsAverage.toFixed(2))}\nProgress: ${((skillsTotalXp/skillsTotalMaxXp) * 100).toFixed(2)}%\nTotal XP: ${numberFormat.format(skillsTotalXp.toFixed())}\n\u200B` },
				{ name: "🌾 Farming", value: `Level: ${numberFormat.format(farmingLevel.level)}\n${(!farmingLevel.percentToNext) ? "" : `${farmingLevel.level} > ${farmingLevel.level + 1}: ${farmingLevel.percentToNext.toFixed(2)}%\n`}Progress: ${farmingLevel.progress.toFixed(2)}%\nTotal XP: ${numberFormat.format(farmingLevel.xpConst.toFixed())}`, inline: true },
				{ name: "⛏ Mining", value: `Level: ${numberFormat.format(miningLevel.level)}\n${(!miningLevel.percentToNext) ? "" : `${miningLevel.level} > ${miningLevel.level + 1}: ${miningLevel.percentToNext.toFixed(2)}%\n`}Progress: ${miningLevel.progress.toFixed(2)}%\nTotal XP: ${numberFormat.format(miningLevel.xpConst.toFixed())}`, inline: true },
				{ name: "⚔ Combat", value: `Level: ${numberFormat.format(combatLevel.level)}\n${(!combatLevel.percentToNext) ? "" : `${combatLevel.level} > ${combatLevel.level + 1}: ${combatLevel.percentToNext.toFixed(2)}%\n`}Progress: ${combatLevel.progress.toFixed(2)}%\nTotal XP: ${numberFormat.format(combatLevel.xpConst.toFixed())}`, inline: true },
				{ name: "🪓 Foraging", value: `Level: ${numberFormat.format(foragingLevel.level)}\n${(!foragingLevel.percentToNext) ? "" : `${foragingLevel.level} > ${foragingLevel.level + 1}: ${foragingLevel.percentToNext.toFixed(2)}%\n`}Progress: ${foragingLevel.progress.toFixed(2)}%\nTotal XP: ${numberFormat.format(foragingLevel.xpConst.toFixed())}`, inline: true },
				{ name: "🎣 Fishing", value: `Level: ${numberFormat.format(fishingLevel.level)}\n${(!fishingLevel.percentToNext) ? "" : `${fishingLevel.level} > ${fishingLevel.level + 1}: ${fishingLevel.percentToNext.toFixed(2)}%\n`}Progress: ${fishingLevel.progress.toFixed(2)}%\nTotal XP: ${numberFormat.format(fishingLevel.xpConst.toFixed())}`, inline: true },
				{ name: "📖 Enchanting", value: `Level: ${numberFormat.format(enchantingLevel.level)}\n${(!enchantingLevel.percentToNext) ? "" : `${enchantingLevel.level} > ${enchantingLevel.level + 1}: ${enchantingLevel.percentToNext.toFixed(2)}%\n`}Progress: ${enchantingLevel.progress.toFixed(2)}%\nTotal XP: ${numberFormat.format(enchantingLevel.xpConst.toFixed())}`, inline: true },
				{ name: "🧪 Alchemy", value: `Level: ${numberFormat.format(alchemyLevel.level)}\n${(!alchemyLevel.percentToNext) ? "" : `${alchemyLevel.level} > ${alchemyLevel.level + 1}: ${alchemyLevel.percentToNext.toFixed(2)}%\n`}Progress: ${alchemyLevel.progress.toFixed(2)}%\nTotal XP: ${numberFormat.format(alchemyLevel.xpConst.toFixed())}`, inline: true },
				{ name: "🐶 Taming", value: `Level: ${numberFormat.format(tamingLevel.level)}\n${(!tamingLevel.percentToNext) ? "" : `${tamingLevel.level} > ${tamingLevel.level + 1}: ${tamingLevel.percentToNext.toFixed(2)}%\n`}Progress: ${tamingLevel.progress.toFixed(2)}%\nTotal XP: ${numberFormat.format(tamingLevel.xpConst.toFixed())}`, inline: true },
				{ name: "\u200B", value: "\u200B", inline: true }
			)
			.setTimestamp()
			.setFooter(`Requested by ${message.author.username}`, message.author.avatarURL());

		const dungeonEmbed = new Discord.MessageEmbed()
			.setColor("#52ba30")
			.setTitle(`Dungeoneering - ${username} (${profiles[selectedProfileIndex].cute_name})`)
			.setDescription(`Dungeoneering information for ${username} from ${profiles[selectedProfileIndex].cute_name} profile.`)
			.addFields(
				{ name: "☠ Catacombs", value: `Level: ${numberFormat.format(catacombsLevel.level)}\n${(!catacombsLevel.percentToNext) ? "" : `${catacombsLevel.level} > ${catacombsLevel.level + 1}: ${catacombsLevel.percentToNext.toFixed(2)}%\n`}Progress: ${catacombsLevel.progress.toFixed(2)}%\nTotal XP: ${numberFormat.format(catacombsLevel.xpConst.toFixed())}\n\u200B` },
				{ name: "💉 Healer", value: `Level: ${numberFormat.format(healerLevel.level)}\n${(!healerLevel.percentToNext) ? "" : `${healerLevel.level} > ${healerLevel.level + 1}: ${healerLevel.percentToNext.toFixed(2)}%\n`}Progress: ${healerLevel.progress.toFixed(2)}%\nTotal XP: ${numberFormat.format(healerLevel.xpConst.toFixed())}`, inline: true },
				{ name: "🪄 Mage", value: `Level: ${numberFormat.format(mageLevel.level)}\n${(!mageLevel.percentToNext) ? "" : `${mageLevel.level} > ${mageLevel.level + 1}: ${mageLevel.percentToNext.toFixed(2)}%\n`}Progress: ${mageLevel.progress.toFixed(2)}%\nTotal XP: ${numberFormat.format(mageLevel.xpConst.toFixed())}`, inline: true },
				{ name: "🗡 Berserk", value: `Level: ${numberFormat.format(berserkLevel.level)}\n${(!berserkLevel.percentToNext) ? "" : `${berserkLevel.level} > ${berserkLevel.level + 1}: ${berserkLevel.percentToNext.toFixed(2)}%\n`}Progress: ${berserkLevel.progress.toFixed(2)}%\nTotal XP: ${numberFormat.format(berserkLevel.xpConst.toFixed())}`, inline: true },
				{ name: "🏹 Archer", value: `Level: ${numberFormat.format(archerLevel.level)}\n${(!archerLevel.percentToNext) ? "" : `${archerLevel.level} > ${archerLevel.level + 1}: ${archerLevel.percentToNext.toFixed(2)}%\n`}Progress: ${archerLevel.progress.toFixed(2)}%\nTotal XP: ${numberFormat.format(archerLevel.xpConst.toFixed())}`, inline: true },
				{ name: "🛡 Tank", value: `Level: ${numberFormat.format(tankLevel.level)}\n${(!tankLevel.percentToNext) ? "" : `${tankLevel.level} > ${tankLevel.level + 1}: ${tankLevel.percentToNext.toFixed(2)}%\n`}Progress: ${tankLevel.progress.toFixed(2)}%\nTotal XP: ${numberFormat.format(tankLevel.xpConst.toFixed())}`, inline: true },
				{ name: "\u200B", value: "\u200B", inline: true }
			)
			.setTimestamp()
			.setFooter(`Requested by ${message.author.username}`, message.author.avatarURL());

		await embedMsg.edit(skillEmbed);

		let tabNum = 0
		
		try {
			await embedMsg.react("🔰");
			await embedMsg.react("☠");
		} catch (error) {
			console.error('One of the emojis failed to react.');
		}

		const userFilter = (reaction, user) => {
			if (user.id === message.author.id) {
				return true;
			} else {
				reaction.users.remove(user);
				return false;
			};
		};

		const reactionCollector = embedMsg.createReactionCollector(userFilter, { time: 20000 });

		reactionCollector.on("collect", (reaction, user) => {
			if (reaction.emoji.name === "🔰") {
				reaction.users.remove(user);
				reactionCollector.resetTimer();
				if (tabNum === 0) return;
				tabNum--;
				embedMsg.edit(skillEmbed);
			} else if (reaction.emoji.name === "☠") {
				reaction.users.remove(user);
				reactionCollector.resetTimer();
				if (tabNum === 1) return;
				tabNum++;
				embedMsg.edit(dungeonEmbed);
			} else {
				reaction.users.remove(user);
			};
		});

		reactionCollector.on("end", () => {
			embedMsg.reactions.removeAll();
		});
	}
};
