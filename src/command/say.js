function commandSay(keys, variables) {
  keys.shift();
  const outString = keys.join(" ");
  let outputTellraw = [{ text: "[" }, { selector: "@s" }, { text: "] " }];
  let posOfLastMatch = 0;
  let requiresCustomParsing = false;
  outString.replace(/\$\{.*?\}/g, (match, start, c, d) => {
    requiresCustomParsing = true;
    let varName = match.replace(/\s+/g, "");
    varName = varName.substring(2, varName.length - 1);

    outputTellraw.push({
      text: outString.substring(posOfLastMatch, start),
    });
    outputTellraw.push({
      score: {
        name: "MCFX-VAR",
        objective: variables[varName].scoreboardID,
      },
    });

    posOfLastMatch = match.length + start;
  });

  if (requiresCustomParsing) {
    return `tellraw @a ${JSON.stringify(outputTellraw)}`;
  }

  return `say ${outString}`;
}

module.exports = { commandSay };
