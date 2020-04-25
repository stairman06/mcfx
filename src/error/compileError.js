const chalk = require("chalk");
const CompileError = {
  exception(type, info) {
    const log = (d) => {
      console.log(
        `${chalk.bgRed("Compile Exception")} ${chalk.yellow(type)} ${d}\n\tin ${
          info.fileName
        }.mcfx\n`
      );
    };

    switch (type) {
      case "undeclared-variable":
        log(`The variable "${info.varName}" is not defined`);
    }
  },
};

module.exports = CompileError;
