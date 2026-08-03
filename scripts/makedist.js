import fs from 'fs';

const DIST_FOLDER = "./dist";
const ESM_SUBFOLDER = DIST_FOLDER + "/esm";
const CJS_SUBFOLDER = DIST_FOLDER + "/cjs";


// creating subfolders DIST and subfolders

if (!fs.existsSync(DIST_FOLDER)){
    fs.mkdirSync(DIST_FOLDER);
}
if (!fs.existsSync(CJS_SUBFOLDER)){
    fs.mkdirSync(CJS_SUBFOLDER);
}
if (!fs.existsSync(ESM_SUBFOLDER)){
    fs.mkdirSync(ESM_SUBFOLDER);
}



const CJS_JSON = `{"type": "commonjs"}`;
const ESM_JSON = `{"type": "module"}`;

const CJS_JSON_PATH = CJS_SUBFOLDER + "/package.json";
const ESM_JSON_PATH = ESM_SUBFOLDER + "/package.json";

// write jsons
fs.writeFileSync(CJS_JSON_PATH, CJS_JSON);

fs.writeFileSync(ESM_JSON_PATH, ESM_JSON);