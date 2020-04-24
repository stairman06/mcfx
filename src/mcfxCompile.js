const crypto = require("crypto");
const { parseVanillaLine } = require("./vanillaCommand");
const { commandSendChat } = require("./command/sendChat");

const minecraftBuiltin = ["say"];
const loadToAdd = [
  `tellraw @a [{"text":"MCFX ALPHA","bold":true},{"text":" Loaded", "bold":false}]`,
];
let definedVariables = {};

function generateUniqueID(varName, fileName, dpID) {
  const sum = crypto.createHash("sha1");
  sum.update(`${dpID}-${fileName}-${varName}`);
  return sum.digest("hex").substring(3, 14);
}

function parseLine(line, fileName, dpID) {
  const keys = line.split(" ");
  if (keys[0] !== "#") {
    if (!minecraftBuiltin.includes(keys[0])) {
      // This is not a builtin Minecraft command
      // We must parse it ourselves
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
              value: keys[3],
            };

            loadToAdd.push(`scoreboard objectives add ${scoreboardID} dummy`);
            return `scoreboard players set MCFX-VAR ${scoreboardID} ${keys[3]}`;
          }
        case "set":
          // Setting a variable
          definedVariables[keys[1]].value = keys[2];
          return `scoreboard players set MCFX-VAR ${
            definedVariables[keys[1]].scoreboardID
          } ${keys[2]}`;
        case "sendChat":
          return commandSendChat(keys, definedVariables);
      }
    } else {
      return parseVanillaLine(line, definedVariables);
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
  console.log("getting lta");
  console.log(loadToAdd);
  return loadToAdd;
}

module.exports = {
  compileMCFXFile,
  getLoadToAdd,
};
