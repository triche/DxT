let getBackendBaseUrl
let setRuntimeConfig
let clearRuntimeConfig

beforeAll(async () => {
  ;({ getBackendBaseUrl, setRuntimeConfig, clearRuntimeConfig } = await import(
    '../src/utils/runtimeConfig.ts'
  ))
})

afterEach(() => {
  clearRuntimeConfig()
})

test('getBackendBaseUrl returns fallback when unset', () => {
  expect(getBackendBaseUrl()).toBe('http://localhost:8080')
  expect(getBackendBaseUrl('http://example.com')).toBe('http://example.com')
})

test('getBackendBaseUrl returns runtime config when set', () => {
  setRuntimeConfig({ backendUrl: 'http://docker.local:8080' })
  expect(getBackendBaseUrl()).toBe('http://docker.local:8080')
})
