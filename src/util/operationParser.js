function operationParser(arg1, operation, arg2, variables, apply) {
  const args = {
    arg1: {
      value: arg1,
    },
    arg2: {
      value: arg2,
    },
  };

  let tempCleanup = [];

  const output = [];

  const getHolderName = (arg) => {
    if (arg.isTemp) return "MCFX-MATHTEMP";

    return "MCFX-VAR";
  };

  if (!Object.keys(variables).includes(arg1))
    args.arg1 = { value: arg1, isTemp: true };

  if (!Object.keys(variables).includes(arg2))
    args.arg2 = { value: arg2, isTemp: true };

  if (Object.keys(variables).includes(arg1))
    args.arg1 = {
      value: arg1,
      scoreboardID: variables[arg1].scoreboardID,
    };
  if (Object.keys(variables).includes(arg2))
    args.arg2 = {
      value: arg2,
      scoreboardID: variables[arg2].scoreboardID,
    };

  Object.keys(args).forEach((arg) => {
    if (args[arg].isTemp) {
      const id = `mathtemp${Math.random().toString(36).substring(7)}`;
      args[arg].scoreboardID = id;

      tempCleanup.push(id);

      output.push(`scoreboard objectives add ${id} dummy`);
      output.push(
        `scoreboard players set MCFX-MATHTEMP ${id} ${args[arg].value}`
      );
    }
  });

  if (apply === "direct") {
    output.push(
      `scoreboard players operation MCFX-VAR ${
        args.arg1.scoreboardID
      } ${operation} ${getHolderName(args.arg2)} ${args.arg2.scoreboardID}`
    );
  } else {
    const tempOut = `mathtemp${Math.random().toString(36).substring(7)}`;
    tempCleanup.push(tempOut);
    output.push(
      `scoreboard objectives add ${tempOut} dummy`,
      `scoreboard players operation MCFX-MATHTEMP ${tempOut} = ${getHolderName(
        args.arg1
      )} ${args.arg1.scoreboardID}`,
      `scoreboard players operation MCFX-MATHTEMP ${tempOut} ${operation} ${getHolderName(
        args.arg2
      )} ${args.arg2.scoreboardID}`,
      `scoreboard players operation MCFX-VAR ${variables[apply].scoreboardID} = MCFX-MATHTEMP ${tempOut}`
    );
  }

  if (tempCleanup.length >= 1) {
    tempCleanup.forEach((cleanup) => {
      output.push(`scoreboard objectives remove ${cleanup}`);
    });
  }

  return output.join("\n");
}

module.exports = operationParser;
