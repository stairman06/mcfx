const path = require("path");
const fs = require("fs");
const rimraf = require("rimraf");
const { compileMCFXFile, getLoadToAdd } = require("./src/mcfxCompile");

const srcPath = path.join("./example");
const dpMeta = JSON.parse(fs.readFileSync(path.join(srcPath, "dp.json")));

const outPath = path.join("./out");

if (fs.existsSync(outPath)) {
  rimraf.sync(outPath);
}

fs.mkdirSync(outPath);

console.log(`MCFX Compiler 0.1`);
console.log(dpMeta.id);

fs.mkdirSync(path.join(outPath, "data"));
fs.mkdirSync(path.join(outPath, "data", dpMeta.id));

fs.writeFileSync(
  path.join(outPath, "pack.mcmeta"),
  JSON.stringify({
    pack: {
      pack_format: 5,
      description: "MCFX Compiled",
    },
  })
);

function compileFunctions(functionsPath, subPath) {
  return new Promise((resolve) => {
    fs.readdir(functionsPath, (err, files) => {
      files.forEach((file) => {
        if (path.extname(file) === ".mcfx") {
          fs.writeFileSync(
            path.join(
              outPath,
              `data/${dpMeta.id}/functions${subPath}${
                path.parse(file).name
              }.mcfunction`
            ),
            compileMCFXFile(
              fs
                .readFileSync(path.join(functionsPath, subPath, file), "utf8")
                .replace(/\r/g, ""),
              `${subPath}${path.parse(file).name}`,
              dpMeta.id
            )
          );

          resolve();
        }
      });
    });
  });
}

fs.mkdirSync(path.join(outPath, `/data/${dpMeta.id}/functions`));

fs.readdir(path.join(srcPath, "data"), async (error, data) => {
  for (let dpData of data) {
    switch (dpData) {
      case "functions":
        await compileFunctions(path.join(srcPath, "data/functions"), "/");
        break;
    }
  }

  const LTA = getLoadToAdd();
  if (LTA) {
    fs.writeFileSync(
      path.join(outPath, `/data/${dpMeta.id}/functions/__mcfx_load.mcfunction`),
      getLoadToAdd().join("\n")
    );

    fs.mkdirSync(path.join(outPath, `/data/minecraft`));
    fs.mkdirSync(path.join(outPath, `/data/minecraft/tags`));
    fs.mkdirSync(path.join(outPath, `/data/minecraft/tags/functions`));
    fs.writeFileSync(
      path.join(outPath, `/data/minecraft/tags/functions/load.json`),
      JSON.stringify({
        values: [`${dpMeta.id}:__mcfx_load`],
      })
    );
  }
});
