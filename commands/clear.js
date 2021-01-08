module.exports = {
	name: "clear",
	cooldown: 1,
	description: "Deletes 100 messages in the channel.",
	guildOnly: true,
	args: false,
	usage: "",
	async execute(message) {
		return message.channel.bulkDelete(100, {filterOld: true});
	}
};

