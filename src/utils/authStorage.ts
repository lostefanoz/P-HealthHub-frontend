export function getAuthStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    const testKey = '__auth_storage_test__'
    window.sessionStorage.setItem(testKey, '1')
    window.sessionStorage.removeItem(testKey)
    return window.sessionStorage
  } catch {
    return null
  }
}
