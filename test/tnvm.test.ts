import { TnvmAgent } from '../src/tnvm/tnvm';
import path = require('path');
import assert = require('assert');

describe('tnvm', () => {
  const version = 'node-v12.0.0';
  const agent = new TnvmAgent(path.resolve('.tnvm'));

  describe('install', () => {
    before(async () => {
      await agent.uninstall(version);
    });

    it(`should install ${version}`, async () => {
      await agent.install(version);
      const installed = await agent.isVersionInstalled(version);
      assert(installed);
    });

    it('should fail for install non-existing version', async () => {
      try {
        await agent.install('foobar-v123.123.123');
      } catch (e) {
        assert.ok(e);
        return;
      }
      assert.fail('unreachable path');
    });
  });

  describe('list/get', () => {
    it(`should get exec path of ${version}`, async () => {
      const execPath = await agent.getExecPathOfVersion(version);
      assert.strictEqual(
        execPath,
        path.resolve(__dirname, '../.tnvm/versions/node/v12.0.0/bin/node')
      );
    });

    it('should list installed versions', async () => {
      const versions = await agent.listVersions('node');
      assert.deepStrictEqual(versions, [version]);
    });

    it('should check if version is installed', async () => {
      let installed = await agent.isVersionInstalled(version);
      assert.strictEqual(installed, true);
      installed = await agent.isVersionInstalled('foobar-v123.123.123');
      assert.strictEqual(installed, false);
    });
  });
});
