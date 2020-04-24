const isSelector = require("./isSelector");
// Converts a standard, non-JSON Object string (e.g. "Test ${variable}") into a JSON one for tellraw output
function parseChatString(
  outString,
  variables,
  selector,
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
      outputTellraw.push({
        score: {
          name: "MCFX-VAR",
          objective: variables[varName].scoreboardID,
        },
      });
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
