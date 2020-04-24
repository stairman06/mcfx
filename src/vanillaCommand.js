const { commandSay } = require("./command/say");
const { commandTell } = require("./command/tell");
const { commandTeleport } = require("./command/teleport");
const { commandExecute } = require("./command/execute");
const { commandSetblock } = require("./command/setblock");

function parseVanillaLine(line, variables, dpID) {
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
    case "execute":
      return commandExecute(keys, variables, dpID);
    case "setblock":
      return commandSetblock(keys, variables);
    default:
      return line;
  }
}

module.exports = { parseVanillaLine };
