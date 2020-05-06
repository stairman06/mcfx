const { commandSay } = require('./command/say');
const { commandTell } = require('./command/tell');
const { commandTeleport } = require('./command/teleport');
const { commandExecute } = require('./command/execute');
const { commandSetblock } = require('./command/setblock');
const { commandSummon } = require('./command/summon');
const keySplitter = require('./util/keySplitter');

function parseVanillaLine(line, variables, fileName, dpID) {
  if (line) {
    const keys = keySplitter(line);

    switch (keys[0]) {
      case 'say':
        return commandSay(keys, variables, fileName);
      case 'tell':
      case 'w':
        return commandTell(keys, variables);
      case 'tp':
      case 'teleport':
        return commandTeleport(keys, variables);
      case 'execute':
        return commandExecute(keys, variables, dpID);
      case 'setblock':
        return commandSetblock(keys, variables);
      case 'summon':
        return commandSummon(keys, variables);
      default:
        return line;
    }
  }

  return line;
}

module.exports = { parseVanillaLine };
