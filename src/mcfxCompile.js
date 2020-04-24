const crypto = require("crypto");
const { parseVanillaLine } = require("./vanillaCommand");
const { commandSendChat } = require("./command/sendChat");

const loadToAdd = [
  `tellraw @a [{"text":"MCFX ALPHA","bold":true},{"text":" Loaded", "bold":false}]`,
];

const operations = ["+=", "/=", "%=", "-=", "*="];

let definedVariables = {};

function generateUniqueID(varName, fileName, dpID) {
  const sum = crypto.createHash("sha1");
  sum.update(`${dpID}-${fileName}-${varName}`);
  return sum.digest("hex").substring(3, 14);
}

function parseLine(line, fileName, dpID) {
  const keys = line.split(" ");
  if (keys[0] !== "#") {
    switch (keys[0]) {
      case "define":
        // Defining a variable
        if (keys[1] === "int") {
          // Defining an integer; use scoreboard
          const scoreboardID = `MCFX-${generateUniqueID(
            keys[2],
            fileName,
            dpID
          )}`;
          definedVariables[keys[2]] = {
            type: "int",
            scoreboardID,
          };

          loadToAdd.push(`scoreboard objectives add ${scoreboardID} dummy`);
          return `scoreboard players set MCFX-VAR ${scoreboardID} ${keys[3]}`;
        }
      case "set":
        if (operations.includes(keys[2])) {
          const scoreboardID = definedVariables[keys[1]].scoreboardID;
          if (Object.keys(definedVariables).includes(keys[3])) {
            return [
              `scoreboard players operation MCFX-VAR ${scoreboardID} ${
                keys[2]
              } MCFX-VAR ${definedVariables[keys[3]].scoreboardID}`,
            ];
          } else {
            // Performing an operation
            const objName = `mathtemp${Math.random()
              .toString(36)
              .substring(7)}`;
            return [
              `scoreboard objectives add ${objName} dummy`,
              `scoreboard players set MCFX-MATHTEMP ${objName} ${keys[3]}`,
              `scoreboard players operation MCFX-VAR ${scoreboardID} ${keys[2]} MCFX-MATHTEMP ${objName}`,
              `scoreboard objectives remove ${objName}`,
            ].join("\n");
          }
        } else if (Object.keys(definedVariables).includes(keys[2])) {
          // Setting a variable to another one
          return `scoreboard players operation MCFX-VAR ${scoreboardID} = MCFX-VAR ${
            definedVariables[keys[2]].scoreboardID
          }`;
        } else {
          // Setting a variable
          return `scoreboard players set MCFX-VAR ${scoreboardID} ${keys[2]}`;
        }
      case "sendchat":
        return commandSendChat(keys, definedVariables);
      default:
        return parseVanillaLine(line, definedVariables, dpID);
    }
  }

  return line;
}

function compileMCFXFile(fileData, fileName, dpID) {
  definedVariables = {};
  return fileData
    .split("\n")
    .map((line) => parseLine(line, fileName, dpID))
    .join("\n");
}

function getLoadToAdd() {
  return loadToAdd;
}

module.exports = {
  compileMCFXFile,
  getLoadToAdd,
  parseLine,
};
