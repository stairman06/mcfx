// TODO: Order of operations, parantheses

/**
 * ExpressionParser parses expressions like
 * variable
 * or
 * variable + variable
 * or
 * (variable + 20) * variable2
 * or any other expression that can exist,
 * and outputs it in an object listing the actions to take
 */

const operators = ["*", "/", "+", "-", "="];

function expressionParser(inputExpression, variables, context) {
  inputExpression = inputExpression.replace(/\s+/g, "");
  const returnActions = [];
  let s = "";
  for (let i = 0; i < inputExpression.length; i++) {
    const char = inputExpression.charAt(i);
    const next = inputExpression.charAt(i + 1);
    s += char;

    if (!isNaN(char) && (isNaN(next) || !next)) {
      // Current one is a number; next is not
      const obj = {
        type: "staticNumber",
        value: s.trim(),
        mathtempID: `mathtemp${Math.random().toString(36).substring(7)}`,
      };

      // Apply to previous operator if needed
      if (
        returnActions.length &&
        returnActions[returnActions.length - 1].type === "operator"
      ) {
        returnActions[returnActions.length - 1].arg2 = obj;
      }

      returnActions.push(obj);

      s = "";
    }

    if (operators.includes(s)) {
      returnActions.push({
        type: "operator",
        operator: s,
        arg1: returnActions[returnActions.length - 1],
      });
      s = "";
    }

    if (variables[s]) {
      if (variables[s].alias) {
        returnActions.push({
          type: "staticNumber",
          value: variables[s].value.trim(),
          mathtempID: `mathtemp${Math.random().toString(36).substring(7)}`,
        });
      } else {
        returnActions.push({
          type: "variable",
          variable: variables[s],
        });
      }
      s = "";
    }
  }

  return returnActions;
}

/**
 * Generates the necessary scoreboard commands for an expression
 */

function generateScoreboardCommands(tokenized, variables, applyTo = "_temp") {
  const cleanupActions = [];
  const info = {};
  const mathtempIDs = {};
  let lastOutArg = "";

  const precalculate = (arg1, operator, arg2) => {
    if (operator.operator === "+") {
      return parseInt(arg1.value) + parseInt(arg2.value);
    }
  };

  // Pre-calculate
  tokenized.forEach((token, index) => {
    if (tokenized[index + 1]) {
      if (token.type === "staticNumber") {
        if (
          tokenized[index + 1].type === "operator" &&
          tokenized[index + 1].arg2.type === "staticNumber"
        ) {
          tokenized[index] = {
            type: "staticNumber",
            value: precalculate(
              token,
              tokenized[index + 1],
              tokenized[index + 1].arg2
            ),
          };
          delete tokenized[index + 1];
          delete tokenized[index + 2];
        }
      }
    }
  });

  tokenized = tokenized.filter((token) => token !== null);

  if (tokenized.length > 1) {
    const getScoreboardID = (token) => {
      if (token.type === "staticNumber") return token.mathtempID;
      if (token.type === "variable") return token.variable.scoreboardID;
    };

    let setup = tokenized
      .filter((token) => token.type === "staticNumber")
      .map((token) => {
        cleanupActions.push(`scoreboard objectives remove ${token.mathtempID}`);
        return [
          `scoreboard objectives add ${token.mathtempID} dummy`,
          `scoreboard players set MCFX-VAR ${token.mathtempID} ${token.value}`,
        ];
      });

    const out = tokenized
      .filter((token) => token.type === "operator")
      .map((token, index) => {
        if (token.type === "operator") {
          if (getScoreboardID(token.arg1) !== applyTo) {
            const newTemp = `mathtemp${Math.random()
              .toString(36)
              .substring(7)}`;
            lastOutArg = newTemp;

            setup.push(`scoreboard objectives add ${newTemp} dummy`);
            cleanupActions.push(`scoreboard objectives remove ${newTemp}`);
            return [
              `scoreboard players operation MCFX-VAR ${newTemp} = MCFX-VAR ${getScoreboardID(
                token.arg1
              )}`,
              `scoreboard players operation MCFX-VAR ${newTemp} ${
                token.operator
              }= MCFX-VAR ${getScoreboardID(token.arg2)}`,
            ];
          } else {
            lastOutArg = token.arg1;
            return [
              `scoreboard players operation MCFX-VAR ${getScoreboardID(
                token.arg1
              )} ${token.operator}= MCFX-VAR ${getScoreboardID(token.arg2)}`,
            ];
          }
        }
      });

    if (applyTo === "_temp") {
      info.output = lastOutArg;
    } else {
      if (getScoreboardID(lastOutArg) !== applyTo) {
        out.push(
          `scoreboard players operation MCFX-VAR ${applyTo} = MCFX-VAR ${lastOutArg}`
        );
      }
      info.output = applyTo;
    }

    return {
      actions: [...setup, ...out].flat(),
      cleanup: cleanupActions,
      output: info.output,
    };
  } else {
    if (tokenized[0].type !== "variable") {
      return {
        isSingle: true,
        value: tokenized[0].value,
      };
    }

    return {
      actions: [],
      cleanup: [],
      output: tokenized[0].variable.scoreboardID,
    };
  }
}

module.exports = { expressionParser, generateScoreboardCommands, operators };
