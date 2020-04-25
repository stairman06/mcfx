const isSelector = require("./isSelector");
const CompileError = require("../error/compileError");
// Converts a standard, non-JSON Object string (e.g. "Test ${variable}") into a JSON one for tellraw output
function parseChatString(
  outString,
  variables,
  selector,
  fileName,
  outputTellraw = [],
  backupCommand,
  useSelectorInBackup
) {
  let posOfLastMatch = 0;
  let requiresCustomParsing = false;
  outString.replace(/\$\{.*?\}/g, (match, start) => {
    // is a mcfx variable
    requiresCustomParsing = true;
    let varName = match.replace(/\s+/g, "");
    varName = varName.substring(2, varName.length - 1);

    outputTellraw.push({
      text: outString.substring(posOfLastMatch, start),
    });

    if (isSelector(varName)) {
      // is a minecraft selector
      outputTellraw.push({
        selector: varName,
      });
    } else {
      const variable = variables[varName];
      if (variable) {
        if (variable.type === "int") {
          outputTellraw.push({
            score: {
              name: "MCFX-VAR",
              objective: variable.scoreboardID,
            },
          });
        }
      } else {
        CompileError.exception("undeclared-variable", {
          varName,
          fileName,
        });
        return;
      }
    }

    posOfLastMatch = match.length + start;
  });

  if (requiresCustomParsing) {
    return `tellraw ${selector} ${JSON.stringify(outputTellraw)}`;
  }

  if (useSelectorInBackup) {
    if (backupCommand) {
      return `${backupCommand} ${selector} ${outString}`;
    }

    return `tellraw ${selector} ${outString}`;
  } else {
    if (backupCommand) {
      return `${backupCommand} ${outString}`;
    }

    return `tellraw ${outString}`;
  }
}

module.exports = parseChatString;
