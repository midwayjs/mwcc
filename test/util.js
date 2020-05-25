const childProcess = require('child_process');

module.exports = { rimraf, flatMap };

function rimraf(dir) {
  if (typeof dir !== 'string') {
    throw new Error('rimraf expects a string at the first argument.');
  }
  childProcess.execSync(`rm -rf ${JSON.stringify(dir)}`);
}

function flatMap(arr, mapper) {
  return arr
    .map(mapper)
    .reduce((previous, current) => previous.concat(current), []);
}
