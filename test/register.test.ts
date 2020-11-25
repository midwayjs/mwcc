import { join } from 'path';
import assert from 'assert';
import { fork } from 'child_process';

export const forkNode = (cwd, tsCode): Promise<string> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('timeout');
    }, 10000);
    try {
      const child = fork(tsCode, [], {
        cwd,
        env: {},
        silent: true,
        execArgv: ['-r', join(__dirname, '../dist/register/index.js')],
      });
      if (child.stdout) {
        child.stdout.on('data', data => {
          resolve(data.toString().trim());
        });
      }
    } catch (e) {
      resolve(e.message);
    }
  });
};

describe('register', () => {
  it('fork node ts register', async () => {
    const cwd = join(__dirname, 'register/tsconfig-paths');
    const tsCode = join(cwd, 'src/index.ts');
    const data: string = await forkNode(cwd, tsCode);
    assert(data === '123:async');
  });
});
