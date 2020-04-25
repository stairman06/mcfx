const path = require("path");
const chalk = require("chalk");

const Compiler = require("./src/compiler/compiler");

require("yargs")
  .usage("Usage: $0 <command> [options]")
  .command(
    "compile <src> [out]",
    "Compiles a source directory to a destination",
    (yargs) => {
      yargs
        .positional("src", {
          describe: "Source directory",
        })
        .positional("out", {
          describe: "Output directory",
          default: "/out",
        });
    },
    (argv) => {
      Compiler.compile(argv.src, argv.out);
    }
  )
  .demandCommand(1)
  .example(
    "$0 compile my_datapack out",
    "Compiles the MCFX files in my_datapack to out"
  )
  .help("h")
  .alias("h", "help")
  .strict()
  .epilog(`MCFX by stairman06 <github.com/stairman06/mcfx>`).argv;
