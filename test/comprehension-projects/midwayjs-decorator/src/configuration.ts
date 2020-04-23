import { Configuration } from '@midwayjs/decorator';

@Configuration({
  imports: ['foo', 'bar'],
})
export class FaaSContainerConfiguration {}
