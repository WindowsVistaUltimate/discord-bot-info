const { Client, Events, GatewayIntentBits } = require("discord.js");
const config = require("./config.json");
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const express = require("express");
const app = express();
const fs = require("fs").promises;
const wsServer = require('websocket').server;
process.on("uncaughtException", (err) => {console.log(err)})
let connections = []
app.get("/", async (req, res) => {
	let temp = [[], {"avatar": client.user.displayAvatarURL(), "tag": client.user.tag}]
	client.guilds.cache.forEach(
		(data) => {
			const icon = data.iconURL()
			if(icon){
				temp[0].push(
					{
						"icon": icon, 
						"id": data.id, 
						"name": data.name, 
						"memberCount": data.memberCount, 
					}
				)
			}
			else{
				temp[0].push(
					{
						"id": data.id, 
						"name": data.name, 
						"memberCount": data.memberCount, 
						"nameAcronym": data.nameAcronym
					}
				)
			}
		}
	)
	temp[0].sort((x,y) => y.memberCount - x.memberCount)
	let file = await fs.readFile("./files/index.html", {encoding: "utf-8"})
	res.send(file.replace("{DATA}", JSON.stringify(temp)))
})
app.get("/favicon.ico", (req, res) => {console.log("A");res.status(200).end()})
app.get("/invite/:id", async (req, res) => {
	const guild = client.guilds.cache.get(req.params.id)
	var temp = await guild.invites.fetch().catch(() => [])
	var invite;
	if (temp.length === 0){
		let fetch;
		if(guild.channels[0]){
			fetch = await client.channels.fetch(guild.channels[0]), {temporary: true, maxAge: 60}
			if(fetch){
				const a = await guild.invites.create(fetch)
				if(a){
					res.redirect(`https://discord.gg/${a}`)
				}
			}
		}
	}
	else{
		temp = JSON.parse(JSON.stringify(temp))
		if(temp[0]){
			res.redirect(`https://discord.gg/${temp[0].code}`)
		}
		else{
			res.redirect("../../")
		}
	}
});
app.get("/guild/:id", (req, res) => {
    res.send(JSON.stringify(client.guilds.cache.get(req.params.id)));
})
app.use('*', (req, res) => {
	res.status(404).redirect("./404")
});
client.on("guildMemberAdd", member => {
	for(a of connections){
		a.sendUTF(`{"t": "gma", "g": ${member.guild.id}}`)
	}
});
client.on("guildMemberRemove", member => {
	for(a of connections){
		a.sendUTF(`{"t": "gmr", "g": ${member.guild.id}`)
	}
});
client.on("ready", () => {
    let server = app.listen(config.PORT, () => {
    });
	client.user.setStatus('idle')
	let ws = new wsServer({httpServer: server, autoAcceptConnections: false});
	ws.on('request', function(request) {
	    var conn = request.accept('refresh', request.origin);
		connections.push(conn)
		let d = setInterval(() => {
			conn.sendUTF('{"t": "ka"}')
		}, 5000);
	    conn.on('close', (reason, desc) => {
			clearInterval(d)
			connections = connections.filter(e => e != conn)
	    });
	});
	console.log(`Website is ready and listening to localhost:${config.PORT}`);
});
client.login(config.TOKEN);