const crypto = require("crypto");
const { parseVanillaLine } = require("./vanillaCommand");
const { commandSendChat } = require("./command/sendChat");
const operationParser = require("./util/operationParser");

const loadToAdd = [
  `tellraw @a [{"text":"MCFX ALPHA","bold":true},{"text":" Loaded", "bold":false}]`,
];

const operations = ["+=", "/=", "%=", "-=", "*="];

let definedVariables = {};
let globalVariables = {};

function generateUniqueID(varName, fileName, dpID) {
  const sum = crypto.createHash("sha1");
  sum.update(`${dpID}-${fileName}-${varName}`);
  return sum.digest("hex").substring(3, 14);
}

function parseLine(line, fileName, dpID) {
  const keys = line.split(" ");
  let variables = { ...definedVariables, ...globalVariables };
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

          if (keys[4] === "global") {
            globalVariables[keys[2]] = {
              type: "int",
              scoreboardID,
            };
          }

          loadToAdd.push(`scoreboard objectives add ${scoreboardID} dummy`);
          return `scoreboard players set MCFX-VAR ${scoreboardID} ${keys[3]}`;
        }
      case "set":
        const scoreboardID = variables[keys[1]].scoreboardID;
        if (operations.includes(keys[2])) {
          if (Object.keys(variables).includes(keys[3])) {
            return [
              `scoreboard players operation MCFX-VAR ${scoreboardID} ${
                keys[2]
              } MCFX-VAR ${variables[keys[3]].scoreboardID}`,
            ];
          } else {
            // Performing an operation
            return operationParser(
              keys[1],
              keys[2],
              keys[3],
              variables,
              "direct"
            );
          }
        } else if (keys[2].substring(0, 1) === "(") {
          // Setting to an expression
          return operationParser(
            keys[2].substring(1),
            keys[3],
            keys[4].substring(0, keys[4].length - 1),
            variables,
            keys[1]
          );
        } else if (Object.keys(variables).includes(keys[2])) {
          // Setting a variable to another one
          return `scoreboard players operation MCFX-VAR ${scoreboardID} = MCFX-VAR ${
            variables[keys[2]].scoreboardID
          }`;
        } else {
          // Setting a variable
          return `scoreboard players set MCFX-VAR ${scoreboardID} ${keys[2]}`;
        }
      case "sendchat":
        return commandSendChat(keys, variables);
      default:
        return parseVanillaLine(line, variables, fileName, dpID);
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
