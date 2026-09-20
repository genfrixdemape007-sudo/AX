import html2canvas from 'html2canvas'

export async function saveNodeAsImage(node, filename) {
  if (!node) return false
  const canvas = await html2canvas(node, {
    backgroundColor: '#FFFFFF',
    scale: 2.5,
    useCORS: true,
  })
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
  return true
}
