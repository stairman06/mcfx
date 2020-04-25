const execTempPos = require("../util/execTempPos");

function commandSummon(keys, variables) {
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

module.exports = { commandSummon };
