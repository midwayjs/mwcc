import { Analyzer } from '../src';
import assert from 'assert';
import { resolve } from 'path';

describe('analyze', () => {
  it('analyze decorator info', async () => {
    const analyzeInstance = new Analyzer({
      projectDir: resolve(__dirname, './analyze/decorators/src'),
    });
    const result: any = analyzeInstance.analyze();
    // console.log('result', JSON.stringify(result, null, ' '));
    assert(result.decorator.Provider[0].target.type === 'class');
    assert(result.decorator.Provider[0].target.name === 'Test');
    assert(
      result.decorator.Provider[0].childDecorators.Func[0].target.type ===
        'method'
    );
    assert(
      result.decorator.Provider[0].childDecorators.Func[0].target.name ===
        'handler'
    );
    assert(
      result.decorator.Provider[0].childDecorators.Func[0].params[0] ===
        'index.handler'
    );
    assert(
      result.decorator.Provider[0].childDecorators.Func[0].params[1].method ===
        'GET'
    );
    assert(
      result.decorator.Provider[0].childDecorators.Func[0].params[1].path ===
        '/api/test'
    );
    assert(
      result.decorator.Provider[0].childDecorators.Func[0].params[1].testNum ===
        123
    );
    assert(
      result.decorator.Provider[0].childDecorators.Func[0].params[1]
        .testBoolean === false
    );
    assert(
      result.decorator.Provider[0].childDecorators.Func[0].params[1]
        .testArray[0] === 'ele-string'
    );
    assert(
      result.decorator.Provider[0].childDecorators.Func[0].params[1]
        .testArray[1] === true
    );
    assert(
      result.decorator.Provider[0].childDecorators.Func[0].params[1]
        .testArray[2] === 123
    );
    assert(result);
  });
  it('analyze class info', async () => {
    const analyzeInstance = new Analyzer({
      projectDir: resolve(__dirname, './analyze/class/src'),
    });
    const result: any = analyzeInstance.analyze();
    // console.log('result', JSON.stringify(result, null, ' '));
    const classList = Object.keys(result.class);
    assert(classList.length === 2);
    assert(result.class[classList[0]].type === 'class');
    assert(result.class[classList[0]].name);
    assert(result.class[classList[0]].fileName);
    assert(result.class[classList[0]].position.range.start);
    assert(result.class[classList[0]].nodeInfo.exportType === 'export');
    assert(result.class[classList[0]].nodeInfo.member.ctx.type === 'property');
    assert(result);
  });
});
