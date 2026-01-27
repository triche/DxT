let getPortList
let arePortMultisetsEqual
let getExternalPorts

beforeAll(async () => {
  ({ getPortList, arePortMultisetsEqual, getExternalPorts } = await import('../src/utils/transformation.ts'))
})

test('getPortList returns string arrays and ignores invalid values', () => {
  expect(getPortList({ inputs: ['a', 'b'] }, 'inputs')).toEqual(['a', 'b'])
  expect(getPortList({ inputs: ['a', 1] }, 'inputs')).toEqual([])
  expect(getPortList({ outputs: 'nope' }, 'outputs')).toEqual([])
})

test('arePortMultisetsEqual matches duplicates regardless of order', () => {
  expect(arePortMultisetsEqual(['a', 'b', 'a'], ['b', 'a', 'a'])).toBe(true)
  expect(arePortMultisetsEqual(['a', 'b'], ['a', 'b', 'b'])).toBe(false)
})

test('getExternalPorts treats unwired ports as external', () => {
  const nodes = [
    { id: 'a', type: 'A', x: 0, y: 0, properties: { inputs: ['in'], outputs: ['out'] } },
    { id: 'b', type: 'B', x: 0, y: 0, properties: { inputs: ['in'], outputs: ['out'] } },
  ]
  const wires = [
    { id: 'w1', fromNodeId: 'a', fromPortIdx: 0, toNodeId: 'b', toPortIdx: 0 },
  ]

  const { externalInputs, externalOutputs } = getExternalPorts(nodes, wires, ['a', 'b'])
  expect(externalInputs.map(p => p.name)).toEqual(['in'])
  expect(externalOutputs.map(p => p.name)).toEqual(['out'])
})

test('getExternalPorts only includes ports crossing selection boundary', () => {
  const nodes = [
    { id: 'src', type: 'Source', x: 0, y: 0, properties: { inputs: [], outputs: ['out'] } },
    { id: 'mid', type: 'Mid', x: 0, y: 0, properties: { inputs: ['in'], outputs: ['out'] } },
    { id: 'sink', type: 'Sink', x: 0, y: 0, properties: { inputs: ['in'], outputs: [] } },
  ]
  const wires = [
    { id: 'w1', fromNodeId: 'src', fromPortIdx: 0, toNodeId: 'mid', toPortIdx: 0 },
    { id: 'w2', fromNodeId: 'mid', fromPortIdx: 0, toNodeId: 'sink', toPortIdx: 0 },
  ]

  const { externalInputs, externalOutputs } = getExternalPorts(nodes, wires, ['mid'])
  expect(externalInputs.map(p => p.name)).toEqual(['in'])
  expect(externalOutputs.map(p => p.name)).toEqual(['out'])
})
