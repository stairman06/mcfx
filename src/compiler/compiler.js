const path = require("path");
const fs = require("fs");
const rimraf = require("rimraf");
const chalk = require("chalk");
const {
  compileMCFXFile,
  compileMCFXTFile,
  getLoadToAdd,
} = require("../mcfxCompile");
const pkg = require("../../package.json");

const Compiler = {
  srcPath: "",
  outPath: "",
  dpMeta: {},
  async compile(srcPath, outPath = "out/") {
    this.srcPath = srcPath;
    this.outPath = outPath;
    this.dpMeta = JSON.parse(fs.readFileSync(path.join(srcPath, "dp.json")));

    console.log(`\n${chalk.greenBright(`MCFX Compiler ${pkg.version}`)}\n`);

    console.log("Compiling...");

    console.time("Compiled in");
    this.createDirectories();
    this.createMCMeta();
    await this.startCompilation();
    console.timeEnd("Compiled in");
  },

  createDirectories() {
    if (fs.existsSync(this.outPath)) {
      rimraf.sync(this.outPath);
    }

    fs.mkdirSync(this.outPath);

    fs.mkdirSync(path.join(this.outPath, "data"));
    fs.mkdirSync(path.join(this.outPath, "data", this.dpMeta.id));

    fs.mkdirSync(path.join(this.outPath, `/data/${this.dpMeta.id}/functions`));
    fs.mkdirSync(
      path.join(
        this.outPath,
        `/data/${this.dpMeta.id}/functions/__mcfx_subroutine`
      )
    );
  },

  createMCMeta() {
    fs.writeFileSync(
      path.join(this.outPath, "pack.mcmeta"),
      JSON.stringify({
        pack: {
          pack_format: 5,
          description: "Compiled with MCFX Compiler Alpha",
        },
      })
    );
  },

  compileFunctions(functionsPath, subPath) {
    return new Promise((resolve) => {
      fs.readdir(functionsPath, (err, files) => {
        files.forEach((file) => {
          if (path.extname(file) === ".mcfx") {
            fs.writeFileSync(
              path.join(
                this.outPath,
                `data/${this.dpMeta.id}/functions${subPath}${
                  path.parse(file).name
                }.mcfunction`
              ),
              compileMCFXFile(
                fs
                  .readFileSync(path.join(functionsPath, subPath, file), "utf8")
                  .replace(/\r/g, ""),
                `${subPath}${path.parse(file).name}`,
                this.dpMeta.id
              )
                .replace(/<<empty>>/g, "")
                .replace(/^\s*\n/gm, "")
            );

            resolve();
          } else if (path.extname(file) === ".mcfxt") {
            compileMCFXTFile(
              fs
                .readFileSync(path.join(functionsPath, subPath, file), "utf8")
                .replace(/\r/g, ""),
              `${subPath}${file}`,
              this.dpMeta.id
            );

            resolve();
          }
        });
      });
    });
  },

  startCompilation() {
    return new Promise(async (resolve) => {
      if (fs.existsSync(path.join(this.srcPath, `/templates`))) {
        await this.compileFunctions(path.join(this.srcPath, "/templates"), "/");
      }
      fs.readdir(
        path.join(this.srcPath, `data/${this.dpMeta.id}`),
        async (error, data) => {
          for (let dpData of data) {
            switch (dpData) {
              case "functions":
                await this.compileFunctions(
                  path.join(this.srcPath, `data/${this.dpMeta.id}/functions`),
                  "/"
                );
                break;
            }
          }

          const LTA = getLoadToAdd();
          if (
            LTA ||
            (this.dpMeta.tags.load &&
              (this.dpMeta.tags.load || this.dpMeta.tags.tick))
          ) {
            if (LTA) {
              fs.writeFileSync(
                path.join(
                  this.outPath,
                  `/data/${this.dpMeta.id}/functions/__mcfx_load.mcfunction`
                ),
                getLoadToAdd().join("\n")
              );
            }

            fs.mkdirSync(path.join(this.outPath, `/data/minecraft`));
            fs.mkdirSync(path.join(this.outPath, `/data/minecraft/tags`));
            fs.mkdirSync(
              path.join(this.outPath, `/data/minecraft/tags/functions`)
            );

            let loadValues = [];

            if (this.dpMeta.tags && this.dpMeta.tags.load) {
              loadValues = this.dpMeta.tags.load;
            }

            if (LTA) loadValues.unshift(`${this.dpMeta.id}:__mcfx_load`);

            fs.writeFileSync(
              path.join(
                this.outPath,
                `/data/minecraft/tags/functions/load.json`
              ),
              JSON.stringify({
                values: loadValues,
              })
            );
          }

          if (this.dpMeta.tags && this.dpMeta.tags.tick) {
            fs.writeFileSync(
              path.join(
                this.outPath,
                `/data/minecraft/tags/functions/tick.json`
              ),
              JSON.stringify({
                values: [...this.dpMeta.tags.tick],
              })
            );
          }
        }
      );

      resolve();
    });
  },

  createSubroutine(data) {
    const id = Math.random().toString(36).substring(8);
    fs.writeFileSync(
      path.join(
        this.outPath,
        `/data/${this.dpMeta.id}/functions/__mcfx_subroutine/${id}.mcfunction`
      ),
      data
    );
    return id;
  },
};

module.exports = Compiler;
