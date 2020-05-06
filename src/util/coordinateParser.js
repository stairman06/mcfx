const { generateScoreboardCommands, expressionParser } = require('./expressionParser');
function getVarName(variable) {
  return variable.replace(/\s+/g, '').substring(2, variable.length - 1);
}

const varMatch = /\$\{.*?\}/g;
function coordinateParser(x, y, z, variables) {
  if (x.match(varMatch) || y.match(varMatch) || z.match(varMatch)) {
    const outs = {};
    const args = { x, y, z };
    const axis = ['x', 'y', 'z'];
    let prepend = [];
    let cleanup = [];

    axis.forEach((axis) => {
      if (args[axis].match(varMatch)) {
        const parsed = generateScoreboardCommands(expressionParser(getVarName(args[axis]), variables), variables);
        prepend = [...prepend, ...parsed.actions];
        cleanup = [...cleanup, ...parsed.cleanup];
        outs[axis] = {
          type: 'score',
          id: parsed.output,
          value: '~',
        };
      } else {
        outs[axis] = {
          type: 'number',
          value: args[axis],
        };
      }
    });

    return {
      type: 'useEntity',
      prepend,
      cleanup,
      x: outs.x,
      y: outs.y,
      z: outs.z,
    };
  }

  return {
    type: 'rawCoords',
    prepend: [],
    cleanup: [],
    x: {
      type: 'number',
      value: x,
    },
    y: {
      type: 'number',
      value: y,
    },
    z: {
      type: 'number',
      value: z,
    },
  };
}

module.exports = coordinateParser;
