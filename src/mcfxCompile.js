const crypto = require("crypto");
const { parseVanillaLine } = require("./vanillaCommand");
const { commandSendChat } = require("./command/sendChat");
const operationParser = require("./util/operationParser");
const getVarName = require("./util/getVarName");
const isSelector = require("./util/isSelector");

const loadToAdd = [
  `tellraw @a [{"text":"MCFX ALPHA","bold":true},{"text":" Loaded", "bold":false}]`,
];

const operations = ["+=", "/=", "%=", "-=", "*="];

let definedVariables = {};
let globalVariables = {};
let definedTemplates = {};

let currentSection = "";
let currentSectionList = [];
let currentLoopTimes = 0;
let currentLoopIName = "";
let currentLoopStartOne = false;

function generateUniqueID(varName, fileName, dpID) {
  const sum = crypto.createHash("sha1");
  sum.update(`${dpID}-${fileName}-${varName}`);
  return sum.digest("hex").substring(3, 14);
}

function parseTemplateVariables(varString, templateArgs, regularVars) {
  const final = {};
  const variables = varString.match(/(?:[^\s"]+|"[^"]*")+/g);
  variables.forEach((variable, index) => {
    if (
      variable.substring(0, 1) === '"' &&
      variable.substring(variable.length - 1) === '"'
    ) {
      final[templateArgs[index]] = {
        type: "string",
        alias: true,
        value: variable.substring(1, variable.length - 1),
      };
    } else if (variable.match(/\$\{.*?\}/g)) {
      const initialVar = regularVars[getVarName(variable)];
      final[templateArgs[index]] = initialVar;
    } else if (isSelector(variable)) {
      final[templateArgs[index]] = {
        type: "selector",
        alias: true,
        value: variable,
      };
    }
  });

  return final;
}

function parseLine(line, fileName, dpID, varOverride) {
  if (!currentSection || line.split(" ")[0] === "loop") {
    let variables;
    if (varOverride === undefined) {
      variables = { ...definedVariables, ...globalVariables };
    } else {
      variables = { ...varOverride, ...definedVariables, ...globalVariables };
    }

    if (line.match(/\$\{.*?\}/g)) {
      // Let's check and replace aliases!

      line = line.replace(/\$\{.*?\}/g, (match) => {
        const varName = getVarName(match);
        if (variables[varName] && variables[varName].alias) {
          return variables[varName].value;
        }

        return match;
      });
    }

    const keys = line.split(" ");

    if (keys[0] !== "#") {
      switch (keys[0]) {
        case "define":
          let context,
            isAlias = false,
            type,
            name,
            value;

          if (keys[1] === "global" || keys[1] === "local") {
            context = keys[1];

            if (keys[2] === "alias") {
              isAlias = true;
              name = keys[3];
              value = keys.slice(4).join(" ");
            } else {
              type = keys[2];
              name = keys[3];
              value = keys[4];
            }
          } else {
            if (keys[1] === "alias") {
              isAlias = true;
              name = keys[2];
              value = keys.slice(3).join(" ");
            } else {
              type = keys[1];
              name = keys[2];
              value = keys[3];
            }
          }
          // Defining a variable
          if (type === "int" && !isAlias) {
            // Defining an integer; use scoreboard
            const scoreboardID = `MCFX-${generateUniqueID(
              name,
              fileName,
              dpID
            )}`;
            let typeToUse = type;
            definedVariables[name] = {
              type: "int",
              scoreboardID,
              value,
            };

            if (context === "global") {
              globalVariables[name] = {
                type: "int",
                scoreboardID,
                value,
              };
            }

            loadToAdd.push(`scoreboard objectives add ${scoreboardID} dummy`);
            return `scoreboard players set MCFX-VAR ${scoreboardID} ${value}`;
          } else if (isAlias) {
            definedVariables[name] = {
              type: "raw",
              alias: isAlias,
              value,
            };

            if (context === "global") {
              globalVariables[name] = {
                type: "raw",
                alias: isAlias,
                value,
              };
            }
          }
          return "<<empty>>";
        case "set":
          const settingVariable = variables[keys[1]];
          if (settingVariable.type === "int" && !settingVariable.alias) {
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
          } else if (settingVariable.alias) {
            const newValue = keys.slice(2).join(" ");
            definedVariables[keys[1]].value = newValue;

            if (globalVariables[keys[1]]) {
              globalVariables[keys[1]].value = newValue;
            }
            return;
          }

        case "sendchat":
          return commandSendChat(keys, variables);
        case "template":
          if (Object.keys(definedTemplates).includes(keys[1])) {
            const template = definedTemplates[keys[1]];
            return compileMCFXFile(
              template.data,
              `templates/${template.id}.mcfxt`,
              dpID,
              parseTemplateVariables(
                keys.slice(2).join(" "),
                template.args,
                variables
              )
            );
          }
          break;
        case "loop":
          if (keys[1] === "start") {
            currentSection = "loop";
            currentLoopTimes = keys[2];
            currentLoopIName = keys[3];
            if (keys[4] === "startAtOne") {
              currentLoopTimes++;
              currentLoopStartOne = true;
            } else {
              currentLoopStartOne = false;
            }
          } else if (keys[1] === "end") {
            currentSection = "";
            let t = [];
            const starter = currentLoopStartOne ? 1 : 0;
            for (let i = starter; i < currentLoopTimes; i++) {
              currentSectionList.forEach((l) =>
                t.push(
                  parseLine(l, fileName, dpID, {
                    [currentLoopIName]: { type: "raw", alias: true, value: i },
                  })
                )
              );
            }

            return t.join("\n");
          }
          break;
        default:
          return parseVanillaLine(line, variables, fileName, dpID);
      }
    }

    return line;
  } else {
    currentSectionList.push(line);
  }
}

function compileMCFXFile(fileData, fileName, dpID, varOverride) {
  definedVariables = {};
  currentSection = "";
  return fileData
    .split("\n")
    .map((line) => parseLine(line, fileName, dpID, varOverride))
    .join("\n");
}

function compileMCFXTFile(fileData, fileName, dpID) {
  const lines = fileData.split("\n");
  let templateData, defineIndex;
  lines.forEach((line, index) => {
    if (line.substring(0, 1) !== "#") {
      const keys = line.split(" ");
      if (keys[0] === "define" && keys[1] === "template") {
        defineIndex = index;
        templateData = {
          id: keys[2],
          args: keys.slice(3),
        };
      }
    }
  });

  templateData.data = lines.slice(defineIndex + 1).join("\n");

  definedTemplates = {
    [templateData.id]: templateData,
  };
}

function getLoadToAdd() {
  return loadToAdd;
}

module.exports = {
  compileMCFXFile,
  compileMCFXTFile,
  getLoadToAdd,
  parseLine,
};
