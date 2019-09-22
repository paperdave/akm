const glob = require('glob');
const fs = require('fs-extra');
const { spawn } = require('child_process');

const defaultMacroFileName = 'macro.out';

async function buildMacroFile(sources, macroFile = defaultMacroFileName) {
  const files = await new Promise(done => {
    glob(sources, async function (er, files) {
      if (er) throw er;
      done(files);
    });
  });

  const marco = (await Promise.all(files.map(filename => fs.readFile(filename)))
    .then(fileContents => fileContents.map(buffer => buffer.toString()))).join('\n');

  await fs.writeFile(macroFile, marco);
}

async function runActKbd(eventName, macroFile = defaultMacroFileName) {
  const child = spawn('actkbd', ['-c', macroFile, '-d', '/dev/input/' + eventName], { stdio: 'inherit' });
  return child;
}

module.exports = {
  buildMacroFile,
  runActKbd,
  defaultMacroFileName,
}
