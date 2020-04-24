const isSelector = require("../util/isSelector");
const execTempPos = require("../util/execTempPos");

function compileAction(action) {
  switch (action.action) {
    case "at":
      if (action.pos)
        return `at ${action.pos.x} ${action.pos.y} ${action.pos.z}`;

      return `at @s`;
    case "run":
      return `run ${action.command}`;
  }
}

function compileActions(actions, includeExecute) {
  const filtered = actions.filter((act) => act.action !== "skip");

  if (filtered.length === 1 && filtered[0].action === "run") {
    return filtered[0].command;
  }

  return `${includeExecute ? "execute " : ""}${filtered
    .map((action) => compileAction(action))
    .join(" ")}`;
}

function commandExecute(keys, variables, dpID) {
  const { parseLine } = require("../mcfxCompile.js");

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
        case "run":
          runCommand = keys.slice(index + 1).join(" ");
          return {
            action,
            command: runCommand,
          };
      }

      return {
        action: "skip",
      };
    })
    .filter((act) => act.action !== "skip");

  const compiled = parsed.map((action, index) => {
    const copyAct = { ...action };
    switch (action.action) {
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
        }

        break;
      case "run":
        const command = parseLine(action.command);
        if (command.split("\n").length > 1) {
          const { createSubroutine } = require("../../main");

          const subroutine = createSubroutine(command);

          return {
            action: "run",
            command: `function ${dpID}:__mcfx_subroutine/${subroutine}`,
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
