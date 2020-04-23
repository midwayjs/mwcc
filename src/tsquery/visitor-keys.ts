import ts = require('typescript')

export interface IVisitorKeys {
  [key: number]: string[]
}

const KnownVisitorKeys = (type: ts.SyntaxKind) => {
  switch (type) {
    case ts.SyntaxKind.QualifiedName: return [
      'left',
      'right'
    ]
    case ts.SyntaxKind.TypeParameter: return [
      'name',
      'constraint',
      'default',
      'expression'
    ]
    case ts.SyntaxKind.ShorthandPropertyAssignment: return [
      'decorators',
      'modifiers',
      'name',
      'questionToken',
      'exclamationToken',
      'equalsToken',
      'objectAssignmentInitializer'
    ]
    case ts.SyntaxKind.SpreadAssignment: return [
      'expression'
    ]
    case ts.SyntaxKind.Parameter: return [
      'decorators',
      'modifiers',
      'dotDotDotToken',
      'name',
      'questionToken',
      'type',
      'initializer'
    ]
    case ts.SyntaxKind.PropertyDeclaration: return [
      'decorators',
      'modifiers',
      'name',
      'questionToken',
      'exclamationToken',
      'type',
      'initializer'
    ]
    case ts.SyntaxKind.PropertySignature: return [
      'decorators',
      'modifiers',
      'name',
      'questionToken',
      'type',
      'initializer'
    ]
    case ts.SyntaxKind.PropertyAssignment: return [
      'decorators',
      'modifiers',
      'name',
      'questionToken',
      'initializer'
    ]
    case ts.SyntaxKind.VariableDeclaration: return [
      'decorators',
      'modifiers',
      'name',
      'exclamationToken',
      'type',
      'initializer'
    ]
    case ts.SyntaxKind.BindingElement: return [
      'decorators',
      'modifiers',
      'dotDotDotToken',
      'propertyName',
      'name',
      'initializer'
    ]
    case ts.SyntaxKind.FunctionType:
    case ts.SyntaxKind.ConstructorType:
    case ts.SyntaxKind.CallSignature:
    case ts.SyntaxKind.ConstructSignature:
    case ts.SyntaxKind.IndexSignature: return [
      'decorators',
      'modifiers',
      'typeParameters',
      'parameters',
      'type'
    ]
    case ts.SyntaxKind.MethodDeclaration:
    case ts.SyntaxKind.MethodSignature:
    case ts.SyntaxKind.Constructor:
    case ts.SyntaxKind.GetAccessor:
    case ts.SyntaxKind.SetAccessor:
    case ts.SyntaxKind.FunctionExpression:
    case ts.SyntaxKind.FunctionDeclaration:
    case ts.SyntaxKind.ArrowFunction: return [
      'decorators',
      'modifiers',
      'asteriskToken',
      'name',
      'questionToken',
      'exclamationToken',
      'typeParameters',
      'parameters',
      'type',
      'equalsGreaterThanToken',
      'body'
    ]
    case ts.SyntaxKind.TypeReference: return [
      'typeName',
      'typeArguments'
    ]
    case ts.SyntaxKind.TypePredicate: return [
      'assertsModifier',
      'parameterName',
      'type'
    ]
    case ts.SyntaxKind.TypeQuery: return [
      'exprName'
    ]
    case ts.SyntaxKind.TypeLiteral: return [
      'members'
    ]
    case ts.SyntaxKind.ArrayType: return [
      'elementType'
    ]
    case ts.SyntaxKind.TupleType: return [
      'elementTypes'
    ]
    case ts.SyntaxKind.UnionType:
    case ts.SyntaxKind.IntersectionType: return [
      'types'
    ]
    case ts.SyntaxKind.ConditionalType: return [
      'checkType',
      'extendsType',
      'trueType',
      'falseType'
    ]
    case ts.SyntaxKind.InferType: return [
      'typeParameter'
    ]
    case ts.SyntaxKind.ImportType: return [
      'argument',
      'qualifier',
      'typeArguments'
    ]
    case ts.SyntaxKind.ParenthesizedType:
    case ts.SyntaxKind.TypeOperator: return [
      'type'
    ]
    case ts.SyntaxKind.IndexedAccessType: return [
      'objectType',
      'indexType'
    ]
    case ts.SyntaxKind.MappedType: return [
      'readonlyToken',
      'typeParameter',
      'questionToken',
      'type'
    ]
    case ts.SyntaxKind.LiteralType: return [
      'literal'
    ]
    case ts.SyntaxKind.ObjectBindingPattern:
    case ts.SyntaxKind.ArrayBindingPattern: return [
      'elements'
    ]
    case ts.SyntaxKind.ArrayLiteralExpression: return [
      'elements'
    ]
    case ts.SyntaxKind.ObjectLiteralExpression: return [
      'properties'
    ]
    case ts.SyntaxKind.PropertyAccessExpression: return [
      'expression',
      'questionDotToken',
      'name'
    ]
    case ts.SyntaxKind.ElementAccessExpression: return [
      'expression',
      'questionDotToken',
      'argumentExpression'
    ]
    case ts.SyntaxKind.CallExpression:
    case ts.SyntaxKind.NewExpression: return [
      'expression',
      'questionDotToken',
      'typeArguments',
      'arguments'
    ]
    case ts.SyntaxKind.TaggedTemplateExpression: return [
      'tag',
      'questionDotToken',
      'typeArguments',
      'template'
    ]
    case ts.SyntaxKind.TypeAssertionExpression: return [
      'type',
      'expression'
    ]
    case ts.SyntaxKind.ParenthesizedExpression: return [
      'expression'
    ]
    case ts.SyntaxKind.DeleteExpression: return [
      'expression'
    ]
    case ts.SyntaxKind.TypeOfExpression: return [
      'expression'
    ]
    case ts.SyntaxKind.VoidExpression: return [
      'expression'
    ]
    case ts.SyntaxKind.PrefixUnaryExpression: return [
      'operand'
    ]
    case ts.SyntaxKind.YieldExpression: return [
      'asteriskToken',
      'expression'
    ]
    case ts.SyntaxKind.AwaitExpression: return [
      'expression'
    ]
    case ts.SyntaxKind.PostfixUnaryExpression: return [
      'operand'
    ]
    case ts.SyntaxKind.BinaryExpression: return [
      'left',
      'operatorToken',
      'right'
    ]
    case ts.SyntaxKind.AsExpression: return [
      'expression',
      'type'
    ]
    case ts.SyntaxKind.NonNullExpression: return [
      'expression'
    ]
    case ts.SyntaxKind.MetaProperty: return [
      'name'
    ]
    case ts.SyntaxKind.ConditionalExpression: return [
      'condition',
      'questionToken',
      'whenTrue',
      'colonToken',
      'whenFalse'
    ]
    case ts.SyntaxKind.SpreadElement: return [
      'expression'
    ]
    case ts.SyntaxKind.Block:
    case ts.SyntaxKind.ModuleBlock: return [
      'statements'
    ]
    case ts.SyntaxKind.SourceFile: return [
      'statements',
      'endOfFileToken'
    ]
    case ts.SyntaxKind.VariableStatement: return [
      'decorators',
      'modifiers',
      'declarationList'
    ]
    case ts.SyntaxKind.VariableDeclarationList: return [
      'declarations'
    ]
    case ts.SyntaxKind.ExpressionStatement: return [
      'expression'
    ]
    case ts.SyntaxKind.IfStatement: return [
      'expression',
      'thenStatement',
      'elseStatement'
    ]
    case ts.SyntaxKind.DoStatement: return [
      'statement',
      'expression'
    ]
    case ts.SyntaxKind.WhileStatement: return [
      'expression',
      'statement'
    ]
    case ts.SyntaxKind.ForStatement: return [
      'initializer',
      'condition',
      'incrementor',
      'statement'
    ]
    case ts.SyntaxKind.ForInStatement: return [
      'initializer',
      'expression',
      'statement'
    ]
    case ts.SyntaxKind.ForOfStatement: return [
      'awaitModifier',
      'initializer',
      'expression',
      'statement'
    ]
    case ts.SyntaxKind.ContinueStatement:
    case ts.SyntaxKind.BreakStatement: return [
      'label'
    ]
    case ts.SyntaxKind.ReturnStatement: return [
      'expression'
    ]
    case ts.SyntaxKind.WithStatement: return [
      'expression',
      'statement'
    ]
    case ts.SyntaxKind.SwitchStatement: return [
      'expression',
      'caseBlock'
    ]
    case ts.SyntaxKind.CaseBlock: return [
      'clauses'
    ]
    case ts.SyntaxKind.CaseClause: return [
      'expression',
      'statements'
    ]
    case ts.SyntaxKind.DefaultClause: return [
      'statements'
    ]
    case ts.SyntaxKind.LabeledStatement: return [
      'label',
      'statement'
    ]
    case ts.SyntaxKind.ThrowStatement: return [
      'expression'
    ]
    case ts.SyntaxKind.TryStatement: return [
      'tryBlock',
      'catchClause',
      'finallyBlock'
    ]
    case ts.SyntaxKind.CatchClause: return [
      'variableDeclaration',
      'block'
    ]
    case ts.SyntaxKind.Decorator: return [
      'expression'
    ]
    case ts.SyntaxKind.ClassDeclaration:
    case ts.SyntaxKind.ClassExpression: return [
      'decorators',
      'modifiers',
      'name',
      'typeParameters',
      'heritageClauses',
      'members'
    ]
    case ts.SyntaxKind.InterfaceDeclaration: return [
      'decorators',
      'modifiers',
      'name',
      'typeParameters',
      'heritageClauses',
      'members'
    ]
    case ts.SyntaxKind.TypeAliasDeclaration: return [
      'decorators',
      'modifiers',
      'name',
      'typeParameters',
      'type'
    ]
    case ts.SyntaxKind.EnumDeclaration: return [
      'decorators',
      'modifiers',
      'name',
      'members'
    ]
    case ts.SyntaxKind.EnumMember: return [
      'name',
      'initializer'
    ]
    case ts.SyntaxKind.ModuleDeclaration: return [
      'decorators',
      'modifiers',
      'name',
      'body'
    ]
    case ts.SyntaxKind.ImportEqualsDeclaration: return [
      'decorators',
      'modifiers',
      'name',
      'moduleReference'
    ]
    case ts.SyntaxKind.ImportDeclaration: return [
      'decorators',
      'modifiers',
      'importClause',
      'moduleSpecifier'
    ]
    case ts.SyntaxKind.ImportClause: return [
      'name',
      'namedBindings'
    ]
    case ts.SyntaxKind.NamespaceExportDeclaration: return [
      'name'

    ]
    case ts.SyntaxKind.NamespaceImport: return [
      'name'
    ]
    case ts.SyntaxKind.NamedImports:
    case ts.SyntaxKind.NamedExports: return [
      'elements'
    ]
    case ts.SyntaxKind.ExportDeclaration: return [
      'decorators',
      'modifiers',
      'exportClause',
      'moduleSpecifier'
    ]
    case ts.SyntaxKind.ImportSpecifier:
    case ts.SyntaxKind.ExportSpecifier: return [
      'propertyName',
      'name'
    ]
    case ts.SyntaxKind.ExportAssignment: return [
      'decorators',
      'modifiers',
      'expression'
    ]
    case ts.SyntaxKind.TemplateExpression: return [
      'templateSpans'
    ]
    case ts.SyntaxKind.TemplateSpan: return [
      'literal'
    ]
    case ts.SyntaxKind.ComputedPropertyName: return [
      'expression'
    ]
    case ts.SyntaxKind.HeritageClause: return [
      'types'
    ]
    case ts.SyntaxKind.ExpressionWithTypeArguments: return [
      'expression',
      'typeArguments'
    ]
    case ts.SyntaxKind.ExternalModuleReference: return [
      'expression'
    ]
    case ts.SyntaxKind.MissingDeclaration: return [
      'decorators'
    ]
    case ts.SyntaxKind.CommaListExpression: return [
      'elements'

    ]
    case ts.SyntaxKind.JsxElement: return [
      'openingElement',
      'children',
      'closingElement'
    ]
    case ts.SyntaxKind.JsxFragment: return [
      'openingFragment',
      'children',
      'closingFragment'
    ]
    case ts.SyntaxKind.JsxSelfClosingElement:
    case ts.SyntaxKind.JsxOpeningElement: return [
      'tagName',
      'typeArguments',
      'attributes'
    ]
    case ts.SyntaxKind.JsxAttributes: return [
      'properties'
    ]
    case ts.SyntaxKind.JsxAttribute: return [
      'name',
      'initializer'
    ]
    case ts.SyntaxKind.JsxSpreadAttribute: return [
      'expression'
    ]
    case ts.SyntaxKind.JsxExpression: return [
      'dotDotDotToken',
      'expression'
    ]
    case ts.SyntaxKind.JsxClosingElement: return [
      'tagName'

    ]
    case ts.SyntaxKind.OptionalType:
    case ts.SyntaxKind.RestType:
    case ts.SyntaxKind.JSDocTypeExpression:
    case ts.SyntaxKind.JSDocNonNullableType:
    case ts.SyntaxKind.JSDocNullableType:
    case ts.SyntaxKind.JSDocOptionalType:
    case ts.SyntaxKind.JSDocVariadicType: return [
      'type'
    ]
    case ts.SyntaxKind.JSDocFunctionType: return [
      'parameters',
      'type'
    ]
    case ts.SyntaxKind.JSDocComment: return [
      'tags'
    ]
    case ts.SyntaxKind.JSDocParameterTag:
    case ts.SyntaxKind.JSDocPropertyTag: return [
      'tagName',
      'name',
      'typeExpression'
    ]
    case ts.SyntaxKind.JSDocAuthorTag: return [
      'tagName'
    ]
    case ts.SyntaxKind.JSDocAugmentsTag: return [
      'tagName',
      'class'
    ]
    case ts.SyntaxKind.JSDocTemplateTag: return [
      'tagName',
      'constraint',
      'typeParameters'
    ]
    case ts.SyntaxKind.JSDocTypedefTag: return [
      'tagName',
      'typeExpression',
      'fullName'
    ]
    case ts.SyntaxKind.JSDocCallbackTag: return [
      'tagName',
      'fullName',
      'typeExpression'
    ]
    case ts.SyntaxKind.JSDocReturnTag:
    case ts.SyntaxKind.JSDocTypeTag:
    case ts.SyntaxKind.JSDocThisTag:
    case ts.SyntaxKind.JSDocEnumTag: return [
      'tagName',
      'typeExpression'
    ]
    case ts.SyntaxKind.JSDocSignature: return [
      'typeParameters',
      'parameters',
      'type'
    ]
    case ts.SyntaxKind.JSDocTypeLiteral: return [
      'jsDocPropertyTags'
    ]
    case ts.SyntaxKind.JSDocTag:
    case ts.SyntaxKind.JSDocClassTag: return [
      'tagName'
    ]
    case ts.SyntaxKind.PartiallyEmittedExpression: return [
      'expression'
    ]
  }
  return []
}

export const VisitorKeys: IVisitorKeys = new Proxy({}, {
  get: (target, key) => {
    return KnownVisitorKeys(key as ts.SyntaxKind) ?? []
  }
})
