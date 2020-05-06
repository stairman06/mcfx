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

/**
 * !WARNING!
 * This file is a **disaster**
 * It's pretty hacky and isn't a good way to parse expressions
 * I need to rewrite it but I need to figure out the best way to do that
 */
const operators = ['*', '/', '+', '-', '='];

function expressionParser(inputExpression, variables, context) {
  inputExpression = inputExpression.replace(/\s+/g, '');
  const returnActions = [];
  let s = '';
  let currentFunc = '';
  let funcString = '';
  for (let i = 0; i < inputExpression.length; i++) {
    const char = inputExpression.charAt(i);
    const next = inputExpression.charAt(i + 1);
    s += char;

    const previousAction = returnActions[returnActions.length - 1];

    if (currentFunc === 'nbt') {
      if (char !== ')') {
        funcString += char;
      } else {
        returnActions.push({
          type: 'nbt',
          selector: funcString.split(',')[0],
          tag: funcString.split(',')[1]
        });
        s = '';
        currentFunc = '';
      }
    }

    if (s === 'nbt(') {
      currentFunc = 'nbt';
      s = '';
    }

    if (!currentFunc) {
      if (operators.includes(s)) {
        if (
          previousAction.type === 'staticNumber' ||
          previousAction.type === 'variable' ||
          previousAction.type === 'nbt'
        ) {
          returnActions.pop();
          returnActions.push({
            type: 'operator',
            operator: s,
            arg1: previousAction,
            lookingForArg2: true
          });
        } else if (previousAction.type === 'operator') {
          returnActions.push({
            type: 'operator',
            operator: s,
            arg1: 'valueOfPrevious',
            lookingForArg2: true
          });
        }
        s = '';
      }

      if (!isNaN(char) && (isNaN(next) || !next)) {
        let dontAdd = false;

        // Current one is a number; next is not
        const obj = {
          type: 'staticNumber',
          value: parseInt(s.trim()),
          mathtempID: `mathtemp${Math.random().toString(36).substring(7)}`
        };

        // Apply to previous operator if needed
        if (previousAction && previousAction.type === 'operator' && previousAction.lookingForArg2) {
          previousAction.arg2 = obj;
          previousAction.lookingForArg2 = false;
          dontAdd = true;
        }

        if (!dontAdd) returnActions.push(obj);

        s = '';
      }

      if (variables[s]) {
        let obj;
        if (variables[s].alias) {
          obj = {
            type: 'staticNumber',
            value: variables[s].value.trim(),
            mathtempID: `mathtemp${Math.random().toString(36).substring(7)}`
          };
        } else {
          obj = {
            type: 'variable',
            variable: variables[s]
          };
        }

        // Apply to previous operator if needed
        if (previousAction && previousAction.type === 'operator' && previousAction.lookingForArg2) {
          previousAction.arg2 = obj;
          previousAction.lookingForArg2 = false;
          dontAdd = true;
        }

        if (!dontAdd) returnActions.push(obj);

        s = '';
      }
    }
  }

  return returnActions;
}

/**
 * Generates the necessary scoreboard commands for an expression
 */

function generateScoreboardCommands(tokenized, variables, applyTo = '_temp') {
  const cleanupActions = [];
  const info = {};
  const mathtempIDs = {};
  let lastOutArg = '';

  let groupedTokens = [];
  let currentTokenIndex = 0;
  tokenized.forEach((token, index) => {
    if (token.type === 'operator') {
      let t = { ...token };

      if (currentTokenIndex !== 0) {
        t.arg1 = tokenized[currentTokenIndex];
      } else {
        t.arg1 = tokenized[index - 1];
      }
      t.arg2 = tokenized[index + 1];

      currentTokenIndex = index;

      groupedTokens.push(t);
    }
  });

  const precalculate = (arg1, operator, arg2) => {
    if (operator === '+') {
      return arg1.value + arg2.value;
    } else if (operator === '-') {
      return arg1.value - arg2.value;
    } else if (operator === '*') {
      return Math.round(arg1.value * arg2.value);
    } else if (operator === '/') {
      return Math.round(arg1.value / arg2.value);
    }
  };

  // Pre-calculate
  tokenized.forEach((token, index) => {
    if (
      token.type === 'operator' &&
      (token.arg1 === 'valueOfPrevious' || token.arg1.type === 'staticNumber') &&
      token.arg2.type === 'staticNumber'
    ) {
      const nextToken = tokenized[index + 1];
      if (nextToken && nextToken.type === 'operator' && nextToken.arg1 === 'valueOfPrevious') {
        tokenized[index] = null;
        nextToken.arg1 = {
          type: 'staticNumber',
          value: precalculate(token.arg1, token.operator, token.arg2)
        };
      } else if (!nextToken && token.arg1 !== 'valueOfPrevious') {
        tokenized[index] = {
          type: 'staticNumber',
          value: precalculate(token.arg1, token.operator, token.arg2)
        };
      } else if (token.arg1 === 'valueOfPrevious') {
        return;
      }
    }
  });

  tokenized = tokenized.filter(token => token !== null);

  if (tokenized.length > 1 || tokenized[0].type === 'nbt' || tokenized[0].type === 'operator') {
    const getScoreboardID = token => {
      if (token.type === 'staticNumber') return token.mathtempID;
      if (token.type === 'variable') return token.variable.scoreboardID;
      if (token.type === 'nbt') return token.mathtempID;
      if (typeof token === 'string') return token;
    };

    let setup = tokenized
      .filter(token => token.type === 'staticNumber')
      .map(token => {
        cleanupActions.push(`scoreboard objectives remove ${token.mathtempID}`);
        return [
          `scoreboard objectives add ${token.mathtempID} dummy`,
          `scoreboard players set MCFX-VAR ${token.mathtempID} ${token.value}`
        ];
      });

    const out = tokenized
      .filter(token => token.type === 'operator' || token.type === 'nbt')
      .map((token, index) => {
        if (token.type === 'operator') {
          const addArg2Obj = () => {
            if (token.arg2.type === 'staticNumber') {
              setup.push(`scoreboard objectives add ${getScoreboardID(token.arg2)} dummy`);
              setup.push(`scoreboard players set MCFX-VAR ${getScoreboardID(token.arg2)} ${token.arg2.value}`);
            }
          };

          if (token.arg1 === 'valueOfPrevious') {
            const previousValue = tokenized[index - 1];

            addArg2Obj();

            token.mathtempID = previousValue.mathtempID;

            return [
              `scoreboard players operation MCFX-VAR ${previousValue.mathtempID} ${
                token.operator
              }= MCFX-VAR ${getScoreboardID(token.arg2)}`
            ];
          } else {
            if (token.arg1.type === 'nbt') {
              const newTemp = `mathtemp${Math.random().toString(36).substring(7)}`;

              if (applyTo !== '_temp' && index === 0) {
                token.arg1.mathtempID = applyTo;
              } else {
                token.arg1.mathtempID = newTemp;
              }

              setup.push(
                `execute store result score MCFX-VAR ${token.arg1.mathtempID} run data get entity ${token.arg1.selector} ${token.arg1.tag}`
              );
            }

            if (getScoreboardID(token.arg1) !== applyTo) {
              const newTemp = `mathtemp${Math.random().toString(36).substring(7)}`;
              lastOutArg = newTemp;

              token.mathtempID = newTemp;

              addArg2Obj();

              setup.push(`scoreboard objectives add ${newTemp} dummy`);
              cleanupActions.push(`scoreboard objectives remove ${newTemp}`);

              let firstCommand;
              if (token.arg1.type === 'staticNumber') {
                firstCommand = `scoreboard players set MCFX-VAR ${newTemp} ${token.arg1.value}`;
              } else {
                firstCommand = `scoreboard players operation MCFX-VAR ${newTemp} = MCFX-VAR ${getScoreboardID(
                  token.arg1
                )}`;
              }
              return [
                firstCommand,
                `scoreboard players operation MCFX-VAR ${newTemp} ${token.operator}= MCFX-VAR ${getScoreboardID(
                  token.arg2
                )}`
              ];
            } else {
              lastOutArg = token.arg1;
              let firstCommand = '';

              if (token.arg2.type === 'staticNumber') {
                setup.push(`scoreboard objectives add ${getScoreboardID(token.arg2)} dummy`);
                firstCommand = `scoreboard players set MCFX-VAR ${getScoreboardID(token.arg2)} ${token.arg2.value}`;
                cleanupActions.push(`scoreboard objectives remove ${getScoreboardID(token.arg2)}`);
              }
              return [
                firstCommand,
                `scoreboard players operation MCFX-VAR ${getScoreboardID(token.arg1)} ${
                  token.operator
                }= MCFX-VAR ${getScoreboardID(token.arg2)}`
              ];
            }
          }
        } else if (token.type === 'nbt') {
          if (applyTo === '_temp') {
            const newTemp = `mathtemp${Math.random().toString(36).substring(7)}`;
            lastOutArg = newTemp;

            token.mathtempID = newTemp;

            setup.push(`scoreboard objectives add ${newTemp} dummy`);
            cleanupActions.push(`scoreboard objectives remove ${newTemp}`);

            return [
              `execute store result score MCFX-VAR ${newTemp} run data get entity ${token.selector} ${token.tag}`
            ];
          } else {
            lastOutArg = applyTo;
            return [
              `execute store result score MCFX-VAR ${applyTo} run data get entity ${token.selector} ${token.tag}`
            ];
          }
        }
      });

    if (applyTo === '_temp') {
      info.output = lastOutArg;
    } else {
      if (getScoreboardID(lastOutArg) !== applyTo) {
        out.push(`scoreboard players operation MCFX-VAR ${applyTo} = MCFX-VAR ${lastOutArg}`);
      }
      info.output = applyTo;
    }

    return {
      actions: [...setup, ...out].flat(),
      cleanup: cleanupActions,
      output: info.output
    };
  } else {
    if (tokenized[0].type !== 'variable' && tokenized[0].type !== 'nbt') {
      return {
        isSingle: true,
        value: tokenized[0].value
      };
    }

    return {
      actions: [],
      cleanup: [],
      output: tokenized[0].variable.scoreboardID
    };
  }
}

module.exports = { expressionParser, generateScoreboardCommands, operators };
