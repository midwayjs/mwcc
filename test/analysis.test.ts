import { Analysis } from '../src';
import assert from 'assert';
import { resolve } from 'path';

describe('analysis', () => {
  it.only('analysis decorator info', async () => {
    const analysisInstance  = new Analysis({
      projectDir: resolve(__dirname, './analysis/decorators/src')
    });
    const result: any = analysisInstance.analysis();
    // console.log('result', JSON.stringify(result, null, ' '));
    assert(result.decorator.Provider[0].target.type === 'class');
    assert(result.decorator.Provider[0].target.name === 'Test');
    assert(result.decorator.Provider[0].childDecorators.Func[0].target.type === 'method');
    assert(result.decorator.Provider[0].childDecorators.Func[0].target.name === 'handler');
    assert(result.decorator.Provider[0].childDecorators.Func[0].params[0] === 'index.handler');
    assert(result.decorator.Provider[0].childDecorators.Func[0].params[1].method === 'GET');
    assert(result.decorator.Provider[0].childDecorators.Func[0].params[1].path === '/api/test');
    assert(result.decorator.Provider[0].childDecorators.Func[0].params[1].testNum === 123);
    assert(result.decorator.Provider[0].childDecorators.Func[0].params[1].testBoolean === false);
    assert(result.decorator.Provider[0].childDecorators.Func[0].params[1].testArray[0] === 'ele-string');
    assert(result.decorator.Provider[0].childDecorators.Func[0].params[1].testArray[1] === true);
    assert(result.decorator.Provider[0].childDecorators.Func[0].params[1].testArray[2] === 123);
    assert(result);
  });
});
