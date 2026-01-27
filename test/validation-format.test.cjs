let formatValidationErrors

beforeAll(async () => {
  ({ formatValidationErrors } = await import('../src/utils/validation.ts'))
})

test('formatValidationErrors returns empty string when no errors', () => {
  const message = formatValidationErrors([])
  expect(message).toBe('')
})

test('formatValidationErrors includes paths and messages', () => {
  const message = formatValidationErrors([
    { path: 'nodes[0].id', message: 'Missing required property' },
    { path: '', message: 'Top-level error' },
  ])

  expect(message).toContain('Validation errors:')
  expect(message).toContain('nodes[0].id: Missing required property')
  expect(message).toContain('Top-level error')
})
