const coordinateParser = require("./coordinateParser");
const getVarName = require("./getVarName");

function execTempPos(posInfo, variables, command, outputExecute = true) {
  const { x, y, z, r1, r2 } = posInfo;

  const parsedCoords = coordinateParser(x, y, z, variables);
  const outCommands = [];

  if (parsedCoords.type === "useEntity" || r1 || r2) {
    const tag = `mcfxpos${Math.random().toString(36).substring(7)}`;

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

    // Rotation
    if (r1 || r2) {
      let permR1 = "0",
        permR2 = "0";
      if (r1.match(/\$\{.*?\}/g)) {
        outCommands.push(
          `execute store result entity @e[tag=${tag},limit=1] Rotation[0] float 1 run scoreboard players get MCFX-VAR ${
            variables[getVarName(r1)].scoreboardID
          }`
        );
      } else {
        permR1 = r1;
      }

      if (r2.match(/\$\{.*?\}/g)) {
        outCommands.push(
          `execute store result entity @e[tag=${tag},limit=1] Rotation[1] float 1 run scoreboard players get MCFX-VAR ${
            variables[getVarName(r2)].scoreboardID
          }`
        );
      } else {
        permR2 = r2;
      }

      outCommands.push(
        `execute as @e[tag=${tag}] at @s run tp @s ~ ~ ~ ${permR1} ${permR2}`
      );
    }

    outCommands.unshift(
      `summon armor_stand ${parsedCoords.x.value} ${parsedCoords.y.value} ${parsedCoords.z.value} {NoGravity:1b,Invisible:1b,Invulnerable:1b,Tags:["${tag}"]}`
    );

    outCommands.push(`execute at @e[tag=${tag},limit=1] run ${command}`);

    outCommands.push(`kill @e[tag=${tag},limit=1]`);
  } else {
    outCommands.push(
      `${outputExecute ? `execute at ${x} ${y} ${z} run ` : ""}${command}`
    );
  }

  return outCommands.join("\n");
}

module.exports = execTempPos;
