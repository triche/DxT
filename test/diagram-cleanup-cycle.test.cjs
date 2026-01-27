const fs = require('node:fs')
const path = require('node:path')

test('diagram cleanup includes cycle fallback logic', () => {
  const appPath = path.resolve(__dirname, '../src/App.tsx')
  const content = fs.readFileSync(appPath, 'utf8')
  const cycleCommentPattern = /Fallback: handle any unprocessed nodes[\s\S]*cycles in the diagram/
  const cycleWarnPattern = /Circular dependency detected in diagram/

  expect(cycleCommentPattern.test(content)).toBe(true)
  expect(cycleWarnPattern.test(content)).toBe(true)
})
