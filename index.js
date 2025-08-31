const mineflayer = require('mineflayer');
const express = require('express');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Bot is running"));
app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));

let baseUsername = 'PUTTUR_SMP';
let botInstance = null;
let reconnecting = false;

// File to store known players
const knownPlayersFile = 'knownPlayers.json';

// Load players from file or create empty list
let knownPlayers = new Set();
if (fs.existsSync(knownPlayersFile)) {
  try {
    const data = fs.readFileSync(knownPlayersFile);
    knownPlayers = new Set(JSON.parse(data));
  } catch (err) {
    console.error("Error reading knownPlayers file:", err);
  }
}

// Save players back to file
function saveKnownPlayers() {
  fs.writeFileSync(knownPlayersFile, JSON.stringify([...knownPlayers], null, 2));
}

// World teleport command (replace %player_name% with username)
const worldCommand = "/mvtp %player_name% lobby";

function createBot() {
  if (botInstance || reconnecting) return;

  reconnecting = false;

  const bot = mineflayer.createBot({
    host: 'puttur_smp.aternos.me',
    port: 48940,
    username: baseUsername,
    version: '1.16.5',
  });

  botInstance = bot;

  bot.on('spawn', () => {
    bot.chat('/register aagop04');
    setTimeout(() => bot.chat('/login aagop04'), 1000);
    setTimeout(() => bot.chat('/mvtp lobby'), 2000);
    setTimeout(() => bot.chat('/tp 0 142 21'),3000);
    // 💡 Apply regeneration effect for 3 hours
    setTimeout(() => {
      bot.chat(`/effect give PUTTUR_SMP minecraft:regeneration 10800 1`);
      console.log("Applied regeneration effect for 3 hours.");
    }, 4000);

    startHumanLikeBehavior();
    scheduleRandomDisconnect();
  });

  // Detect when a player joins
  bot.on('playerJoined', (player) => {
    const username = player.username;
    if (username === bot.username) return; // Ignore the bot itself

    if (!knownPlayers.has(username)) {
      // New player, teleport them
      console.log(`New player detected: ${username}, teleporting...`);
      setTimeout(() => {
        bot.chat(worldCommand.replace("%player_name%", username));
      }, 2000);

      // Save them permanently
      knownPlayers.add(username);
      saveKnownPlayers();
    } else {
      console.log(`Returning player ${username}, no teleport.`);
    }
  });

  function startHumanLikeBehavior() {
    const actions = ['forward', 'back', 'left', 'right', 'jump', 'sneak'];

    function moveRandomly() {
      const action = actions[Math.floor(Math.random() * actions.length)];
      bot.setControlState(action, true);
      setTimeout(() => {
        bot.setControlState(action, false);
        const delay = 1000 + Math.random() * 6000;
        setTimeout(moveRandomly, delay);
      }, 300 + Math.random() * 1000);
    }

    moveRandomly();
  }

  function scheduleRandomDisconnect() {
    const minutes = Math.floor(Math.random() * (120 - 60 + 1)) + 60;
    console.log(`Next disconnect scheduled in ${minutes} minutes.`);
    setTimeout(() => {
      console.log("Random disconnecting...");
      bot.quit();
    }, minutes * 60 * 1000);
  }

  bot.on('end', () => {
    botInstance = null;
    if (!reconnecting) {
      const delay = Math.floor(Math.random() * 6 + 5) * 1000;
      console.log(`Bot disconnected. Reconnecting in ${delay / 1000} seconds...`);
      setTimeout(createBot, delay);
    }
  });

  bot.on('error', console.log);
}

createBot();
