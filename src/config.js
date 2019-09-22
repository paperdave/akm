const path = require('path');
const fs = require('fs-extra');
const configFileLocation = path.join(process.env.HOME, '.akm.json');

let currentConfig = { macros: [] };

function reloadConfig() {
  if (fs.existsSync(configFileLocation)) {
    try {
      currentConfig = JSON.parse(fs.readFileSync(configFileLocation));
    } catch (error) {
      console.log('Error Reading Config File; Regenerating It');
      fs.writeFileSync(configFileLocation, JSON.stringify(currentConfig));
    }
  }
}

function sendReload() {
  require('net').createConnection(32295).end('R');
}

function updateConfig(object) {
  currentConfig = object;
  fs.writeFileSync(configFileLocation, JSON.stringify(currentConfig));
  sendReload();
}
function getConfig() {
  return currentConfig;
}

reloadConfig();

module.exports = {
  updateConfig,
  getConfig,
  sendReload,
  reloadConfig
}
