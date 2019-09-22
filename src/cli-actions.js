// CLI functions.
const cli = require('cli');
const inquirer = require('inquirer');
const { getKeyboardDevices, getInputDevices } = require('./device-reader');
const { getConfig, updateConfig } = require('./config');
const path = require('path');
const shelljs = require('shelljs');
const { spawn } = require('child_process');
const sudo = require('sudo-prompt');
const fs = require('fs-extra');
const net = require('net');
const { findXInputDevices, disableXInputDevice, enableXInputDevice } = require('./xinput');

function trimLines(string) {
  return string.replace(/^(\n|\t| )+/, '').replace(/(\n|\t| )+$/, '') + '\n';
}

async function doPermissionFix() {
  const userName = process.env.USER;
  const groupID = (await fs.stat('/dev/input/event0')).gid;
  const groupInfo = shelljs.exec('getent group ' + groupID, { silent: true }).stdout;
  const groupName = groupInfo.match(/(.*?):/)[1];
  sudo.exec(`usermod -a -G ${groupName} ${userName}`);
}

async function install() {
  const qa = await inquirer.prompt([{
    type: 'confirm',
    default: false,
    name: 'confirm',
    message: 'Part of the installation involves modifying your groups, which is not setup to undo itself in the uninstaller. Are you sure you want to continue?'
  }]);

  if(qa.confirm) {
    console.log('[1/2]: The Permission Fix');
    await doPermissionFix();
    console.log('[2/2]: Profile Change');

    const filename = path.join(process.env.HOME, '.profile');

    let content = fs.existsSync(filename) ? fs.readFileSync(filename).toString() : '';
    content = content.replace(/(^|\n)# AKM BACKGROUND PROCESS\nsetsid npx akm daemon(\n|$)/, '\n');

    fs.writeFileSync(filename, trimLines(content + '\n# AKM BACKGROUND PROCESS\nsetsid npx akm daemon'));

    console.log('Installed in ' + filename);
    console.log('Notice: You will need to log out and log back in before you can actually use AKM.');
    console.log();
  }
}
async function uninstall() {
  const qa = await inquirer.prompt([{
    type: 'confirm',
    default: false,
    name: 'confirm',
    message: 'Are you sure you want to remove the background daemon.'
  }]);

  if (qa.confirm) {
    const filename = path.join(process.env.HOME, '.profile');

    let content = fs.existsSync(filename) ? fs.readFileSync(filename).toString() : '';
    content = content.replace(/(^|\n)# AKM BACKGROUND PROCESS\nsetsid npx akm daemon(\n|$)/, '\n');

    fs.writeFileSync(filename, trimLines(content));

    try {
      const conn = net.createConnection(32295);
      conn.end('E');
      conn.on('error', () => {});
    } catch (error) {}

    console.log('Uninstalled from ' + filename);
    console.log();
  }
}

function resolveWithHome(filePath) {
  if (filePath[0] === '~') {
    return path.join(process.env.HOME, filePath.slice(1));
  }
  return path.resolve(filePath);
}

async function addKeyboard() {
  const devices = await (cli.options.all ? getInputDevices : getKeyboardDevices)();
  const config = getConfig();

  const results = await inquirer.prompt([{
    name: 'device',
    message: 'Found ' + devices.length + ' keyboard devices. Which one should be used?',
    type: 'list',
    choices: devices.map(device => ({ name: device.name, type: 'choice', value: device, disabled: config.macros.find(macro => macro.device === device.name) && 'IN USE'}))
  },{
    name: 'fileGlob',
    message: 'Where are your macro file(s) located? [glob match]',
    type: 'input',
    default: '~/*.akm',
  }]);

  const macroConf = {
    device: results.device.name,
    files: resolveWithHome(results.fileGlob),
  };

  config.macros.push(macroConf);
  updateConfig(config);

  console.log('Added ' + results.device.name);
  console.log();
}

async function removeKeyboard() {
  const config = getConfig();

  if (config.macros.length === 0) {
    console.log('You have no macro configurations added... Meaning you can\'t remove any of them...');
    return;
  }

  const results = await inquirer.prompt([{
    name: 'macro',
    message: 'You have ' + config.macros.length + ' Macro Configuration' + (config.macros.length === 1 ? '' : 's') + ' Added. Which do you want to remove?',
    type: 'list',
    choices: config.macros.map(macro => ({ name: macro.device, type: 'choice', value: macro }))
  }]);

  config.macros = config.macros.filter(macro => macro !== results.macro);
  updateConfig(config);

  console.log('Removed ' + results.macro.name);
  console.log();
}

async function listKeyboards() {
  const config = getConfig();

  if (config.macros.length === 0) {
    console.log('You have no macro configurations added... Meaning you can\'t remove any of them...');
    console.log();
    return;
  }

  config.macros.forEach(macro => {
    console.log(macro.name + ', running files ' + macro.files);
  });
  console.log();
}

async function runDebugKeyboard() {
  const devices = await (cli.options.all ? getInputDevices : getKeyboardDevices)();

  const results = await inquirer.prompt([{
    name: 'device',
    message: 'Found ' + devices.length + ' keyboard devices. Which one should be used?',
    type: 'list',
    choices: devices.map(device => ({ name: device.name, type: 'choice', value: device }))
  }]);

  const eventName = results.device.handlers.find(x => x.startsWith('event'));

  console.log('Starting Keyboard Debug on ' + eventName);

  try {
    net.createConnection(32295).end('P');
  } catch (error) {}


  const xInputDevices = await findXInputDevices(results.device.name);
  await disableXInputDevice(xInputDevices);

  const child = spawn('actkbd', ['-d', `/dev/input/${eventName}`, '-s']);

  child.stderr.on('data', (data) => {
    process.stdout.write(data);
  });
  child.stdout.on('data', (data) => {
    process.stdout.write(data);
  });

  child.on('exit', async() => {
    await enableXInputDevice(xInputDevices);
    try {
      net.createConnection(32295).end('U');
    } catch (error) {}
  });

  process.on('SIGINT', function () {
    if (!child.killed) {
      console.log('');
      console.log('Stopping, Resetting Keyboard.');
      child.kill();
    }
  });
}

module.exports = {
  addKeyboard,
  removeKeyboard,
  listKeyboards,
  runDebugKeyboard,
  install,
  uninstall,
};
