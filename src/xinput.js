// javascript interface for the `xinput` command.
// ** 'xinput' meaning an input devices for X, not microsoft's controller stuff.
const { spawn } = require('child_process');

const idRegex = /id=([0-9]+)/;

async function listXInputDevices() {
  // run xinput and steal it's output.
  const data = await new Promise(done => {
    let data = '';
    const xinput = spawn('xinput');
    xinput.stdout.on('data', (chunk) => { data += chunk.toString(); })
    xinput.on('exit', () => { done(data) })
  });

  // split newline
  return data.split('\n')
    // remove last empty one
    .slice(0, -1)
    // go over each...
    .map(
      // ...& remove the weird symbols
      line => line.replace(/⎣|⎜|⎡|↳/g, ' ')
      // split on tabs, conveniently added.
        .split('\t')
      // trim the whitespace on everything.
        .map(chunk => chunk.trim())
    )
    .map((line) => {
      // extract id from `id=xx`
      return { name: line[0], id: idRegex.exec(line[1])[1] }
    })
}
async function findXInputDevices(name) {
  name = name.toLowerCase().replace(/keyboard$/, '').trim();
  const devices = await listXInputDevices();
  return devices.filter(device => device.name.toLowerCase().startsWith(name));
}
async function disableXInputDevice(...devices) {
  if(Array.isArray(devices[0])) devices = devices[0];

  await Promise.all(devices.map(device => new Promise(done => {
    const xinput = spawn('xinput', ['disable', device.id]);
    xinput.on('exit', () => { done() })
  })))
}
async function enableXInputDevice(...devices) {
  if(Array.isArray(devices[0])) devices = devices[0];

  await Promise.all(devices.map(device => new Promise(done => {
    const xinput = spawn('xinput', ['enable', device.id]);
    xinput.on('exit', () => { done() })
  })))
}

module.exports = {
  listXInputDevices,
  findXInputDevices,
  disableXInputDevice,
  enableXInputDevice
}
