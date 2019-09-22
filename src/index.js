#!/usr/bin/node
const cli = require('cli');

cli.setApp('action-keyboard-manager', );

cli.getUsage = () => {
  console.log('action-keyboard-manager v' + require('../package.json').version + '\t\t\tby dave caruso');
  console.log();
  console.log('[usage]');
  console.log('  akm <command>');
  console.log();
  console.log('[options]');
  console.log('  -a, --all     - show all devices, not just what it thinks are keyboards.');
  console.log();
  console.log('[commands]');
  console.log('  akm ls        - list setup keyboards');
  console.log('  akm add       - add a new keyboard');
  console.log('  akm remove    - add a keyboard');
  console.log('  akm reload    - reload macro files');
  console.log('  akm install   - installs the background service');
  console.log('  akm uninstall - removes the background service');
  console.log('  akm debug     - start actkbd in debug mode on a keyboard');
  console.log();

  process.exit();
};
cli.parse({ all: ['a', 'show all devices'] }, ['ls', 'add', 'remove', 'reload', 'install', 'uninstall', 'debug', 'daemon']);

const commands = {
  ls() {
    require('./cli-actions').listKeyboards();
  },
  add() {
    require('./cli-actions').addKeyboard();
  },
  remove() {
    require('./cli-actions').removeKeyboard();
  },
  reload() {
    require('./config').sendReload();
    console.log('Reloading Daemon');
    console.log();
  },
  install() {
    require('./cli-actions').install();
  },
  uninstall() {
    require('./cli-actions').uninstall();
  },
  debug() {
    require('./cli-actions').runDebugKeyboard();
  },
  daemon() {
    require('./akmd');
  }
}

commands[cli.command]();
