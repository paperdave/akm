const { getInputDevices } = require('./device-reader');

function startWatchingDevices(onChange) {
  // watcher disabled to save battery

  // (async function() {
  //   let devices = (await getInputDevices()).map((device) => device.name).sort().join(';');
  //   setInterval(async() => {
  //     const newDevices = (await getInputDevices()).map((device) => device.name).sort().join(';');;

  //     if (newDevices !== devices) {
  //       devices = newDevices;
  //       onChange();
  //     }
  //   }, 2000);
  // })();
}

module.exports = {
  startWatchingDevices
}
