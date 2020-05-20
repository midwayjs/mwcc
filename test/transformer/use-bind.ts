import ts from 'typescript'
import { TransformationContext } from '../../'
import { USE } from '../../src/util'

export default {
  transform: (ctx: TransformationContext) => {
    USE(ctx)
    return {
      'CallExpression Identifier': (node: ts.Identifier) => {
        if (node.text.startsWith('use')) {
          return ts.createCall(ts.createPropertyAccess(
            node,
            ts.createIdentifier('bind')
          ), [], [ts.createThis()])
        }

        return node
      }
    }
  }
}
