import { glob } from "tinyglobby";
import { File } from "./file.js";
import { FileCollection } from "./file_collection.js";
import { ModuleCollection } from "./module_collection.js";
import { Transformer } from "./t.js";
import { resolvePath } from "./io.js";
import { compileJsonScheme2 } from "./json_schema.js";

async function compile(input, output, options) {
  const inputDir = resolvePath(input);
  const outputDir = resolvePath(output);

  const paths = await glob("**/account.yaml", {
    cwd: inputDir,
    absolute: true,
  });

  const files = await Promise.all(paths.map((path) => File.readYaml(path)));
  const filesCollection = new FileCollection(files);
  const moduleCollection = new ModuleCollection(files);

  const transformer = new Transformer(files, filesCollection, moduleCollection);

  transformer.normalize();

  console.log(await Promise.all(files.map((file) => compileJsonScheme2(file))));

  // console.log(filesCollection.get("account").toString());
  // console.log(files.at(1));
}

await compile(
  "~/sift/code/java/sift-json/src/main/json",
  "~/sift/console/src/schema/",
);
