const execTempPos = require("../util/execTempPos");

function commandSetblock(keys, variables) {
  return execTempPos(
    {
      x: keys[1],
      y: keys[2],
      z: keys[3],
    },
    variables,
    `setblock ~ ~ ~ ${keys.slice(4).join(" ")}`
  );
}

module.exports = { commandSetblock };
