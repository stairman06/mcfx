const { commandSay } = require("./command/say");
const { commandTell } = require("./command/tell");

function parseVanillaLine(line, variables) {
  const keys = line.split(" ");
  switch (keys[0]) {
    case "say":
      return commandSay(keys, variables);
    case "tell":
    case "w":
      return commandTell(keys, variables);
  }
}

module.exports = { parseVanillaLine };
