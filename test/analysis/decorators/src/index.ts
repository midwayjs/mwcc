const Provider: any = () => 0;
const Inject: any = () => 0;
const Func: any = () => 0;
const Oth: any = () => 0;

interface IResult {
  success: boolean;
  data: number[];
}

@Provider()
export class Test {

  @Inject('context')
  private ctx: any;

  @Oth
  private oth: any;

  constructor(name: string, age: number) {
    console.log('init');
  }

  @Func('index.handler', { method: 'GET', path: '/api/test' })
  public async handler(event: { d: { name: string}; name: string}): Promise<IResult> {
    console.log(event.d.name, event.name, this.ctx, this.oth);
    return {
      success: true,
      data: [ 1, 2, 3 ],
    };
  }
}
