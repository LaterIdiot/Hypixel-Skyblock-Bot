const fetch = require("node-fetch");

async function findPlayerData(username) {
	const playerData = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`)
		.then((response) => response.json())
		.then((data) => {
			return data;
		})
		.catch(() => {return null});

	return playerData;
}

module.exports = { findPlayerData };
