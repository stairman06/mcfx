const isSelector = require("../util/isSelector");
const coordinateParser = require("../util/coordinateParser");

function getVarName(variable) {
  return variable.replace(/\s+/g, "").substring(2, variable.length - 1);
}

function commandTeleport(keys, variables) {
  if (keys.join(" ").match(/\$\{.*?\}/g)) {
    keys.shift();

    const tag = `mcfx${Math.random().toString(36).substring(7)}`;

    const outCommands = [];

    // We have variables, extra fun parsing time
    let selector = "@s";
    let permR1 = 0,
      permR2 = 0;
    let parsedCoords;
    if (isSelector(keys[0])) {
      selector = keys[0];

      parsedCoords = coordinateParser(keys[1], keys[2], keys[3], variables);

      if (keys[4] === "facing") {
        outCommands.push(
          `execute as @e[tag=${tag},limit=1] at @s run tp @s ~ ~ ~ facing ${keys[5]} ${keys[6]} ${keys[7]}`
        );
      } else {
        if (keys[4] && keys[5]) {
          if (keys[4].match(/\$\{.*?\}/g)) {
            outCommands.push(
              `execute store result entity @e[tag=${tag},limit=1] Rotation[0] float 1 run scoreboard players get MCFX-VAR ${
                variables[getVarName(keys[4])].scoreboardID
              }`
            );
          } else {
            permR1 = keys[4];
          }

          if (keys[5].match(/\$\{.*?\}/g)) {
            outCommands.push(
              `execute store result entity @e[tag=${tag},limit=1] Rotation[1] float 1 run scoreboard players get MCFX-VAR ${
                variables[getVarName(keys[5])].scoreboardID
              }`
            );
          } else {
            permR2 = keys[5];
          }
        }
      }
    } else {
      parsedCoords = coordinateParser(keys[0], keys[1], keys[2], variables);
    }

    // Save a score to the entity
    const saveScore = (dest, scoreboardID) => {
      outCommands.push(
        `execute store result entity @e[tag=${tag},limit=1] ${dest} double 1 run scoreboard players get MCFX-VAR ${scoreboardID}`
      );
    };

    // Variable positions
    if (parsedCoords.x.type === "score") {
      saveScore("Pos[0]", parsedCoords.x.id);
    }

    if (parsedCoords.y.type === "score") {
      saveScore("Pos[1]", parsedCoords.y.id);
    }

    if (parsedCoords.z.type === "score") {
      saveScore("Pos[2]", parsedCoords.z.id);
    }

    // Do we have constant/permanent Rotation values?
    if (permR1 || permR2) {
      outCommands.unshift(
        `execute as @e[tag=${tag},limit=1] at @s run tp @s ~ ~ ~ ${permR1} ${permR2}`
      );
    }

    // Figure out exactly where to spawn the temporary armor stand
    let spawnX = "~",
      spawnY = "~",
      spawnZ = "~";

    if (parsedCoords.x.type === "number") spawnX = parsedCoords.x.value;
    if (parsedCoords.y.type === "number") spawnY = parsedCoords.y.value;
    if (parsedCoords.z.type === "number") spawnZ = parsedCoords.z.value;

    // Spawn the armor stand
    outCommands.unshift(
      `summon armor_stand ${spawnX} ${spawnY} ${spawnZ} {NoGravity:1b,Invisible:1b,Invulnerable:1b,Tags:["${tag}"]}`
    );

    // Teleport the selector to the armor stand, then kill the armor stand
    outCommands.push(`tp ${selector} @e[tag=${tag},limit=1]`);
    outCommands.push(`kill @e[tag=${tag},limit=1]`);

    return outCommands.join("\n");
  }

  return keys.join(" ");
}

module.exports = { commandTeleport };
