// DSH Remote descriptors for the dsh-think-twice host service.
const json = Object.freeze({
  parse(value) {
    return value
  },
})

const descriptor = (method) => ({
  id: `dsh-think-twice/remote#dshThinkTwice/${method}`,
  service: 'dshThinkTwice',
  namespace: 'dshThinkTwice',
  method,
  invocation: { kind: 'direct' },
  parameters: [{
    name: 'request',
    wire: 'request',
    source: 'json',
    codec: {
      mode: 'strict',
      typeSymbol: 'dsh-think-twice#JsonRequest',
      schema: json,
      create: () => json,
    },
  }],
  result: {
    mode: 'strict',
    typeSymbol: 'dsh-think-twice#JsonResult',
    schema: json,
    create: () => json,
  },
})

export default Object.freeze({
  package: 'dsh-think-twice',
  descriptors: Object.freeze([
    descriptor('review'),
    descriptor('feedback'),
  ]),
})

