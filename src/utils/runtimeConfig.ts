export type DxtRuntimeConfig = {
  backendUrl?: string
}

declare global {
  // eslint-disable-next-line no-var
  var __DXT_CONFIG__: DxtRuntimeConfig | undefined

  interface Window {
    __DXT_CONFIG__?: DxtRuntimeConfig
  }
}

const getRuntimeConfig = (): DxtRuntimeConfig | undefined => {
  return globalThis.__DXT_CONFIG__
}

export const getBackendBaseUrl = (fallback = 'http://localhost:8080'): string => {
  const config = getRuntimeConfig()
  if (config?.backendUrl && typeof config.backendUrl === 'string') {
    return config.backendUrl
  }
  return fallback
}

export const setRuntimeConfig = (config: DxtRuntimeConfig): void => {
  globalThis.__DXT_CONFIG__ = {
    ...(globalThis.__DXT_CONFIG__ ?? {}),
    ...config,
  }
}

export const clearRuntimeConfig = (): void => {
  delete globalThis.__DXT_CONFIG__
}
