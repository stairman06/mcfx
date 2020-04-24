const isSelector = require("../util/isSelector");

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
    let permX = "~",
      permY = "~",
      permZ = "~";
    let permR1 = 0,
      permR2 = 0;
    if (isSelector(keys[0])) {
      selector = keys[0];

      if (keys[1].match(/\$\{.*?\}/g)) {
        outCommands.push(
          `execute store result entity @e[tag=${tag},limit=1] Pos[0] double 1 run scoreboard players get MCFX-VAR ${
            variables[getVarName(keys[1])].scoreboardID
          }`
        );
      } else {
        permX = keys[1];
      }

      if (keys[2].match(/\$\{.*?\}/g)) {
        outCommands.push(
          `execute store result entity @e[tag=${tag},limit=1] Pos[1] double 1 run scoreboard players get MCFX-VAR ${
            variables[getVarName(keys[2])].scoreboardID
          }`
        );
      } else {
        permY = keys[2];
      }

      if (keys[3].match(/\$\{.*?\}/g)) {
        outCommands.push(
          `execute store result entity @e[tag=${tag},limit=1] Pos[2] double 1 run scoreboard players get MCFX-VAR ${
            variables[getVarName(keys[2])].scoreboardID
          }`
        );
      } else {
        permZ = keys[3];
      }

      if (keys[4] === "facing") {
        outCommands.push(
          `execute as @e[tag=${tag},limit=1] at @s run tp @s ~ ~ ~ facing ${keys[5]} ${keys[6]} ${keys[7]}`
        );
      } else {
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
    } else {
      if (keys[0].match(/\$\{.*?\}/g)) {
        outCommands.push(
          `execute store result entity @e[tag=${tag},limit=1] Pos[0] double 1 run scoreboard players get MCFX-VAR ${
            variables[getVarName(keys[0])].scoreboardID
          }`
        );
      } else {
        permX = keys[0];
      }

      if (keys[1].match(/\$\{.*?\}/g)) {
        outCommands.push(
          `execute store result entity @e[tag=${tag},limit=1] Pos[1] double 1 run scoreboard players get MCFX-VAR ${
            variables[getVarName(keys[1])].scoreboardID
          }`
        );
      } else {
        permY = keys[1];
      }

      if (keys[2].match(/\$\{.*?\}/g)) {
        outCommands.push(
          `execute store result entity @e[tag=${tag},limit=1] Pos[2] double 1 run scoreboard players get MCFX-VAR ${
            variables[getVarName(keys[2])].scoreboardID
          }`
        );
      } else {
        permZ = keys[2];
      }

      if (keys[3] === "facing") {
        outCommands.push(
          `execute as @e[tag=${tag},limit=1] at @s run tp @s ~ ~ ~ facing ${keys[4]} ${keys[5]} ${keys[6]}`
        );
      }
    }

    if (permR1 || permR2) {
      outCommands.unshift(
        `execute as @e[tag=${tag},limit=1] at @s run tp @s ~ ~ ~ ${permR1} ${permR2}`
      );
    }
    outCommands.unshift(
      `summon armor_stand ${permX} ${permY} ${permZ} {NoGravity:1b,Invisible:1b,Invulnerable:1b,Tags:["${tag}"]}`
    );

    outCommands.push(`tp ${selector} @e[tag=${tag},limit=1]`);
    outCommands.push(`kill @e[tag=${tag},limit=1]`);
    return outCommands.join("\n");
  }

  return keys.join(" ");
}

module.exports = { commandTeleport };
