import assert from 'assert';
import { ts } from '../src';
import * as typescript from 'typescript';

describe('export', () => {
  it('should export typescript', async () => {
    assert.deepStrictEqual(ts, typescript);
  });
});
