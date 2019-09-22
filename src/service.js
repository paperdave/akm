const path = require('path');
const fs = require('fs-extra');
const shelljs = require('shelljs');
const sudo = require('sudo-prompt');
const inquirer = require('inquirer');

async function doPermissionFix() {
  const userName = process.env.USER;
  const groupID = (await fs.stat('/dev/input/event0')).gid;
  const groupInfo = shelljs.exec('getent group ' + groupID, { silent: true }).stdout;
  const groupName = groupInfo.match(/(.*?):/)[1];
  sudo.exec(`usermod -a -G ${groupName} ${userName}`);
  console.log('You will need to log out and log back in before you can actually use AKM.');
}

async function install() {
  const qa = await inquirer.prompt([{
    type: 'confirm',
    default: false,
    name: 'confirm',
    message: 'Part of the installation involves modifying your groups, which is not setup to undo itself in the uninstaller. Are you sure you want to continue?'
  }]);

  // console.log('Part One: The Permission Fix')
  // doPermissionFix();
}
async function uninstall() {
  
}

module.exports = {
  install,
  uninstall,
};
