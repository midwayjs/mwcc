import { tsAnalysisInstance } from '../src';
import assert from 'assert';
import { resolve } from 'path';

describe('analysis', () => {
  it.only('analysis decorator info', async () => {
    const result: any = await tsAnalysisInstance({
      projectDir: resolve(__dirname, './analysis/decorators/src')
    });
    assert(result.decorator.Provider[0].target.type === 'class');
    assert(result.decorator.Provider[0].target.name === 'Test');
    assert(result.decorator.Provider[0].childDecorators.Func[0].target.type === 'method');
    assert(result.decorator.Provider[0].childDecorators.Func[0].target.name === 'handler');
    assert(result);
  });
});
