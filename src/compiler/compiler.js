const path = require("path");
const fs = require("fs");
const rimraf = require("rimraf");
const chalk = require("chalk");
const mkdirp = require("mkdirp");
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
            if (
              !fs.existsSync(
                path.join(
                  this.outPath,
                  `data/${this.dpMeta.id}/functions${subPath}`
                )
              )
            ) {
              mkdirp.sync(
                path.join(
                  this.outPath,
                  `data/${this.dpMeta.id}/functions${subPath}`
                )
              );
            }
            fs.writeFileSync(
              path.join(
                this.outPath,
                `data/${this.dpMeta.id}/functions${subPath}${
                  path.parse(file).name
                }.mcfunction`
              ),
              compileMCFXFile(
                fs
                  .readFileSync(path.join(functionsPath, file), "utf8")
                  .replace(/\r/g, ""),
                `${subPath}${path.parse(file).name}`,
                this.dpMeta.id
              )
                .replace(/<<empty>>/g, "")
                .replace(/^\s*$(?:\r\n?|\n)/gm, "")
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
          } else if (
            fs.lstatSync(path.join(functionsPath, file)).isDirectory()
          ) {
            this.compileFunctions(
              path.join(functionsPath, file),
              `${subPath}/${file}/`
            );
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
              default:
                fs.mkdirSync(
                  path.join(this.outPath, `/data/${this.dpMeta.id}/${dpData}`)
                );
                this.copyDirSync(
                  path.join(this.srcPath, `data/${this.dpMeta.id}/${dpData}`),
                  path.join(this.outPath, `/data/${this.dpMeta.id}/${dpData}/`)
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

            if (this.dpMeta.tags && this.dpMeta.tags.load) {
              loadValues = [...loadValues, ...this.dpMeta.tags.load];
            }
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

  copyDirSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (exists && isDirectory) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest);
      }
      fs.readdirSync(src).forEach((childItem) => {
        this.copyDirSync(path.join(src, childItem), path.join(dest, childItem));
      });
    } else if (!fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
    }
  },

  createSubroutine(data, forceName) {
    let id, p, namepath;

    if (!forceName) {
      id = Math.random().toString(36).substring(8);
      p = `/data/${Compiler.dpMeta.id}/functions/__mcfx_subroutine/${id}.mcfunction`;
      namepath = `__mcfx_subroutine/${id}`;
    } else {
      id = forceName;
      if (forceName.substring(0, 1) === "/") {
        namepath = forceName.substring(1);
        p = `/data/${Compiler.dpMeta.id}/functions${forceName}.mcfunction`;
        mkdirp.sync(path.join(Compiler.outPath, path.dirname(p)));
      } else {
        namepath = forceName;
        p = `/data/${Compiler.dpMeta.id}/functions/__mcfx_subroutine/${id}.mcfunction`;
      }
    }

    fs.writeFileSync(
      path.join(Compiler.outPath, p),
      data.replace(/<<empty>>/g, "").replace(/^\s*$(?:\r\n?|\n)/gm, "")
    );
    return namepath;
  },
};

module.exports = Compiler;
