const fetch = require("node-fetch");

async function findUuid(username) {
	const uuid = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`)
		.then((response) => response.json())
		.then((data) => {
			return data.id;
		})
		.catch((err) => console.error(err));

	return uuid;
}

module.exports = { findUuid };
