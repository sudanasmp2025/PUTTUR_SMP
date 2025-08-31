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
let knownPlayers = new Set();

if (fs.existsSync(knownPlayersFile)) {
  try {
    knownPlayers = new Set(JSON.parse(fs.readFileSync(knownPlayersFile)));
  } catch (err) {
    console.error("Error reading knownPlayers file:", err);
  }
}

function saveKnownPlayers() {
  fs.writeFileSync(knownPlayersFile, JSON.stringify([...knownPlayers], null, 2));
}

const worldCommand = "/mvtp %player_name% lobby";

function createBot() {
  if (botInstance || reconnecting) return;

  reconnecting = true;

  const bot = mineflayer.createBot({
    host: 'puttur_smp.aternos.me',
    port: 48940,
    username: baseUsername,
    version: '1.16.5',
  });

  botInstance = bot;

  bot.once('spawn', () => {
    console.log("Bot spawned successfully.");

    // Login / register sequence with delays
    setTimeout(() => bot.chat('/register aagop04'), 1500);
    setTimeout(() => bot.chat('/login aagop04'), 3000);
    setTimeout(() => bot.chat('/mvtp lobby'), 5000);
    setTimeout(() => bot.chat('/tp PUTTUR_SMP 0 142 21'), 7000);

    // Regeneration effect
    setTimeout(() => {
      bot.chat(`/effect give ${bot.username} minecraft:regeneration 10800 1`);
      console.log("Applied regeneration effect for 3 hours.");
    }, 9000);

    startHumanLikeBehavior();
    scheduleRandomDisconnect();
  });

  bot.on('playerJoined', (player) => {
    const username = player.username;
    if (username === bot.username) return;

    if (!knownPlayers.has(username)) {
      console.log(`New player detected: ${username}, teleporting...`);
      setTimeout(() => {
        bot.chat(worldCommand.replace("%player_name%", username));
      }, 2000);

      knownPlayers.add(username);
      saveKnownPlayers();
    } else {
      console.log(`Returning player ${username}, no teleport.`);
    }
  });

  function startHumanLikeBehavior() {
    const actions = ['forward', 'back', 'left', 'right', 'jump', 'sneak'];

    function moveRandomly() {
      if (!botInstance) return;
      const action = actions[Math.floor(Math.random() * actions.length)];
      bot.setControlState(action, true);

      setTimeout(() => {
        bot.setControlState(action, false);
        const delay = 2000 + Math.random() * 4000;
        setTimeout(moveRandomly, delay);
      }, 500 + Math.random() * 1000);
    }

    moveRandomly();
  }

  function scheduleRandomDisconnect() {
    const minutes = Math.floor(Math.random() * 61) + 60; // 60–120 minutes
    console.log(`Next disconnect scheduled in ${minutes} minutes.`);
    setTimeout(() => {
      if (botInstance) {
        console.log("Random disconnecting...");
        bot.quit();
      }
    }, minutes * 60 * 1000);
  }

  bot.on('end', () => {
    console.log("Bot disconnected.");
    botInstance = null;
    if (reconnecting) reconnecting = false;

    const delay = Math.floor(Math.random() * 6 + 5) * 1000;
    console.log(`Reconnecting in ${delay / 1000} seconds...`);
    setTimeout(createBot, delay);
  });

  bot.on('error', (err) => {
    console.error("Bot error:", err);
  });
}

createBot();
