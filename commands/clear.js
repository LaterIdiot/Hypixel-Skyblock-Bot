module.exports = {
	name: "clear",
	cooldown: 5,
	description: "Deletes 100 messages in the channel.",
	guildOnly: true,
	args: false,
	usage: "[amount]",
	async execute(message, args) {
		if (args.length === 0) return message.channel.bulkDelete(100);

		const amount = parseInt(args[0]);

		if (isNaN(amount)) return message.reply("The amount parameter isn`t a number!")
		if (amount > 100) return message.reply("I can only delete 100 messages at a time.")

		message.channel.bulkDelete(amount);
	}
};

