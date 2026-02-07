const { contextBridge } = require('electron')

const backendUrl = process.env.DXT_BACKEND_URL || 'http://localhost:8080'

contextBridge.exposeInMainWorld('__DXT_CONFIG__', {
  backendUrl,
})
