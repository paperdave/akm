console.log('Action Keyboard Manager Daemon. v' + require('../package.json').version);

const { getConfig, reloadConfig } = require('./config');
const { buildMacroFile, runActKbd } = require('./actkbd');
const { listXInputDevices, disableXInputDevice, enableXInputDevice } = require('./xinput');
const { getInputDevices } = require('./device-reader');
const { startWatchingDevices } = require('./device-watcher');

const net = require('net');

let loadedMacros = [];

function delay(ms) { return new Promise(x => setTimeout(x,ms))}

function findXInputDevices(deviceList, name) {
  name = name.toLowerCase().replace(/keyboard$/, '').trim();
  return deviceList.filter(device => device.name.toLowerCase().startsWith(name));
}

async function unload() {
  await Promise.all(loadedMacros.map(async(macro) => {
    if (!macro.actkbd.killed) {
      macro.actkbd.kill();
    }
    await enableXInputDevice(macro.xInputDevices);
  }));
  loadedMacros = [];
}
async function load() {
  const devices = await getInputDevices();
  const xInputDeviceList = await listXInputDevices();
  const config = getConfig();
  await Promise.all(config.macros.map(async(macro, i) => {
    const device = devices.find(device => device.name === macro.device);

    if(device) {
      const eventName = device.handlers.find(x => x.startsWith('event'));
      console.log(`Loading ${macro.device} on ${eventName}.`);

      await buildMacroFile(macro.files, '/tmp/akm_macro_' + i);
      const xInputDevices = findXInputDevices(xInputDeviceList, macro.device);
      await disableXInputDevice(xInputDevices);

      const actkbd = await runActKbd(eventName, '/tmp/akm_macro_' + i);
      loadedMacros.push({ actkbd, xInputDevices });
    } else {
      console.log(`Skipping ${macro.device} as it was not found.`);
    }
  }));
}

async function reload() {
  await unload();
  await reloadConfig();
  await load();
}

function startup() {
  const server = net.createServer((socket) => {
    socket.on('data', (data) => {
      if (data.toString() === 'R') {
        console.log('Reloading Configuration');
        reload();
      }
      if (data.toString() === 'P') {
        unload();
      }
      if (data.toString() === 'U') {
        load();
      }
      if (data.toString() === 'E') {
        process.exit();
      }
    });
  });
  server.listen(32295, '127.0.0.1', () => {
    load();

    startWatchingDevices(() => {
      console.log('Reloading Macros');
      reload();
    });
  });
  return server;
}

startup().on('error', () => {
  net.createConnection(32295).end('E');
  setTimeout(() => {
    startup();
  }, 2000);
});

process.on('SIGINT', async() => {
  console.log('Shutting Down.')
  await unload();
  console.log();
  process.exit();
});
