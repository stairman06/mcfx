const CompileError = require("../error/compileError");

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
    args.arg1 = { value: parseInt(arg1), isTemp: true };

  if (!Object.keys(variables).includes(arg2))
    args.arg2 = { value: parseInt(arg2), isTemp: true };

  if (Object.keys(variables).includes(arg1)) {
    if (variables[arg1].alias) {
      args.arg1 = {
        value: parseInt(variables[arg1].value),
        isTemp: true,
      };
    } else {
      args.arg1 = {
        value: parseInt(arg1),
        scoreboardID: variables[arg1].scoreboardID,
      };
    }
  }
  if (Object.keys(variables).includes(arg2)) {
    if (variables[arg2].alias) {
      args.arg2 = {
        value: parseInt(variables[arg2].value),
        isTemp: true,
      };
    } else {
      args.arg2 = {
        value: parseInt(arg2),
        scoreboardID: variables[arg2].scoreboardID,
      };
    }
  }

  if (!args.arg1.isTemp || !args.arg2.isTemp) {
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
  } else {
    let out;
    if (operation === "+=") {
      out = args.arg1.value + args.arg2.value;
    } else if (operation === "-=") {
      out = args.arg1.value - args.arg2.value;
    } else if (operation === "/=") {
      out = args.arg1.value / args.arg2.value;
    } else if (operation === "*=") {
      out = args.arg1.value * args.arg2.value;
    }

    output.push(
      `scoreboard players set MCFX-VAR ${variables[apply].scoreboardID} ${out}`
    );
  }

  return output.join("\n");
}

module.exports = operationParser;
