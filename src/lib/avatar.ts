export async function avatarToDataUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, { mode: 'cors' })
    if (!response.ok) return url
    const blob = await response.blob()
    return await blobToDataUrl(blob)
  } catch {
    return url
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read avatar image'))
    reader.readAsDataURL(blob)
  })
}
