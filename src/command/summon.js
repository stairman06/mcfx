const execTempPos = require("../util/execTempPos");

function commandSummon(keys, variables) {
  if (keys.join(" ").match(/\$\{.*?\}/g)) {
    return execTempPos(
      {
        x: keys[2],
        y: keys[3],
        z: keys[4],
      },
      variables,
      `summon ${keys[1]} ~ ~ ~ ${keys.slice(5).join(" ")}`
    );
  }

  return keys.join(" ");
}

module.exports = { commandSummon };
