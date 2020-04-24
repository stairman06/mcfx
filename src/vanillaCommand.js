const { commandSay } = require("./command/say");
const { commandTell } = require("./command/tell");
const { commandTeleport } = require("./command/teleport");

function parseVanillaLine(line, variables) {
  const keys = line.split(" ");
  switch (keys[0]) {
    case "say":
      return commandSay(keys, variables);
    case "tell":
    case "w":
      return commandTell(keys, variables);
    case "tp":
    case "teleport":
      return commandTeleport(keys, variables);
  }
}

module.exports = { parseVanillaLine };
