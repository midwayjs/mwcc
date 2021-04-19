import { join } from 'path';
import assert from 'assert';
import { fork } from 'child_process';

export const forkNode = (cwd, tsCode): Promise<string> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject('timeout');
    }, 10000);
    const child = fork(tsCode, [], {
      cwd,
      env: {},
      silent: true,
      execArgv: ['-r', join(__dirname, '../dist/register/index.js')],
    });
    if (child.stdout == null) {
      reject(new Error('child stdout is not found'));
      return;
    }

    let stdout = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', data => {
      stdout += data.trim();
    });
    child.on('exit', () => {
      resolve(stdout);
      clearTimeout(timer);
    });
  });
};

describe.skip('register', () => {
  it('fork node ts register', async () => {
    const cwd = join(__dirname, 'register/tsconfig-paths');
    const tsCode = join(cwd, 'src/index.ts');
    const data = await forkNode(cwd, tsCode);
    assert.strictEqual(data, '123:async');
  });
});
