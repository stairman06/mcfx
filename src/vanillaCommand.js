const { commandSay } = require("./command/say");

function parseVanillaLine(line, variables) {
  const keys = line.split(" ");
  switch (keys[0]) {
    case "say":
      return commandSay(keys, variables);
  }
}

module.exports = { parseVanillaLine };
