const isSelector = require("../util/isSelector");
const execTempPos = require("../util/execTempPos");

function compileAction(action) {
  switch (action.action) {
    case "at":
      if (action.pos)
        return `at ${action.pos.x} ${action.pos.y} ${action.pos.z}`;
      if (action.selector) return `at ${action.selector}`;

      return `at @s`;
    case "as":
      return `as ${action.target}`;
    case "if":
      if (action.decider === "entity") return `if entity ${action.entity}`;
      if (action.decider === "block")
        return `if block ${action.pos.x} ${action.pos.y} ${action.pos.z} ${action.type}`;
    case "run":
      return `run ${action.command}`;
  }
}

function compileActions(actions, includeExecute) {
  const filtered = actions.filter(
    (act) => act !== undefined && act.action !== "skip"
  );

  if (filtered.length === 1 && filtered[0].action === "run") {
    return filtered[0].command;
  }

  return `${includeExecute ? "execute " : ""}${filtered
    .map((action) => compileAction(action))
    .join(" ")}`;
}

function commandExecute(keys, variables, dpID) {
  const { parseLine } = require("../mcfxCompile.js");

  keys = keys.join(" ");
  keys = keys.match(/(?:[^\s"]+|"[^"]*")+/g);

  const keymap = {
    align: "swizzle",
    anchored: "anchor",
    as: "target",
  };

  let runCommand;

  const parsed = keys
    .map((action, index) => {
      switch (action) {
        case "align":
        case "anchored":
        case "as":
          return {
            action,
            [keymap[action]]: keys[index + 1],
          };
        case "at":
          if (isSelector(keys[index + 1])) {
            // At a selector
            return {
              action,
              selector: keys[index + 1],
            };
          }

          // At a position
          return {
            action,
            pos: {
              x: keys[index + 1],
              y: keys[index + 2],
              z: keys[index + 3],
            },
          };
        case "facing":
          if (keys[index + 1] === "entity") {
            // Facing an entity
            return {
              action,
              entity: keys[index + 2],
              anchor: keys[index + 3],
            };
          }

          return {
            action,
            pos: {
              x: keys[index + 1],
              y: keys[index + 2],
              z: keys[index + 3],
            },
          };
        case "if":
          if (keys[index + 1] === "entity") {
            return {
              action,
              decider: "entity",
              entity: keys[index + 2],
            };
          } else if (keys[index + 1] === "block") {
            return {
              action,
              decider: "block",
              pos: {
                x: keys[index + 2],
                y: keys[index + 3],
                z: keys[index + 4],
              },
              type: keys[index + 5],
            };
          }
          break;
        case "run":
          runCommand = keys.slice(index + 1).join(" ");
          return {
            action,
            command: runCommand,
          };
        default:
          return {
            action: "skip",
          };
      }

      return {
        action: "skip",
      };
    })
    .filter((act) => act.action !== "skip");

  const compiled = parsed.map((action, index) => {
    switch (action.action) {
      case "as":
      case "if":
        return action;
      case "at":
        if (action.pos) {
          // At a position
          parsed[
            parsed.findIndex((a) => a.action === "run")
          ].command = execTempPos(
            {
              x: action.pos.x,
              y: action.pos.y,
              z: action.pos.z,
            },
            variables,
            compileActions(parsed.slice(index + 1)),
            false
          );

          return {
            action: "skip",
          };
        } else if (action.selector) {
          return {
            action: "at",
            selector: action.selector,
          };
        }

        break;
      case "run":
        const command = parseLine(action.command, "__nested__", dpID);
        if (command.split("\n").length > 1) {
          const { createSubroutine } = require("../compiler/compiler");

          let subroutine;
          if (variables["__forceSubroutineName"]) {
            subroutine = createSubroutine(
              command,
              variables["__forceSubroutineName"].value
            );
          } else {
            subroutine = createSubroutine(command);
          }

          return {
            action: "run",
            command: `function ${dpID}:${subroutine}`,
          };
        } else {
          return {
            action: "run",
            command,
          };
        }
    }
  });

  return compileActions(compiled, true);
}

module.exports = { commandExecute };
