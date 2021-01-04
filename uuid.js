const fetch = require('node-fetch');

async function find(username) {
	return (await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`).then(response => response.json())).id
}

module.exports = {find}