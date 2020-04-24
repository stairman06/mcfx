function getVarName(variable) {
  return variable.replace(/\s+/g, "").substring(2, variable.length - 1);
}

const varMatch = /\$\{.*?\}/g;
function coordinateParser(x, y, z, variables) {
  if (x.match(varMatch) || y.match(varMatch) || z.match(varMatch)) {
    const outs = {};
    const args = { x, y, z };
    const axis = ["x", "y", "z"];

    axis.forEach((axis) => {
      if (args[axis].match(varMatch)) {
        outs[axis] = {
          type: "score",
          id: variables[getVarName(args[axis])].scoreboardID,
          value: "~",
        };
      } else {
        outs[axis] = {
          type: "number",
          value: args[axis],
        };
      }
    });

    return {
      type: "useEntity",
      x: outs.x,
      y: outs.y,
      z: outs.z,
    };
  }

  return {
    type: "rawCoords",
    x: {
      type: "number",
      value: x,
    },
    y: {
      type: "number",
      value: y,
    },
    z: {
      type: "number",
      value: z,
    },
  };
}

module.exports = coordinateParser;
