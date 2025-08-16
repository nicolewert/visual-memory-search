import { createWorker, Worker } from 'tesseract.js'

let worker: Worker | null = null

async function getWorker(): Promise<Worker> {
  if (!worker) {
    worker = await createWorker('eng')
  }
  return worker
}

export async function extractTextFromImage(file: File): Promise<string> {
  try {
    const worker = await getWorker()
    
    // Convert file to image data for preprocessing
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Unable to get canvas context')

    const img = new Image()
    const imageUrl = URL.createObjectURL(file)
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve('')
      }, 30000) // 30 second timeout

      img.onload = async () => {
        try {
          // Set canvas size to image size
          canvas.width = img.width
          canvas.height = img.height
          
          // Draw image to canvas
          ctx.drawImage(img, 0, 0)
          
          // Convert to grayscale for better OCR accuracy
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageData.data
          
          for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
            data[i] = gray     // red
            data[i + 1] = gray // green
            data[i + 2] = gray // blue
            // alpha channel (i + 3) remains unchanged
          }
          
          ctx.putImageData(imageData, 0, 0)
          
          // Convert canvas to blob
          canvas.toBlob(async (blob) => {
            if (blob) {
              try {
                const { data: { text } } = await worker!.recognize(blob)
                clearTimeout(timeout)
                URL.revokeObjectURL(imageUrl)
                resolve(text.trim())
              } catch (error) {
                console.error('OCR processing error:', error)
                clearTimeout(timeout)
                URL.revokeObjectURL(imageUrl)
                resolve('')
              }
            } else {
              clearTimeout(timeout)
              URL.revokeObjectURL(imageUrl)
              resolve('')
            }
          })
        } catch (error) {
          console.error('Image processing error:', error)
          clearTimeout(timeout)
          URL.revokeObjectURL(imageUrl)
          resolve('')
        }
      }

      img.onerror = () => {
        console.error('Failed to load image for OCR')
        clearTimeout(timeout)
        URL.revokeObjectURL(imageUrl)
        resolve('')
      }

      img.src = imageUrl
    })
  } catch (error) {
    console.error('OCR initialization error:', error)
    return ''
  }
}

export async function cleanupOCR(): Promise<void> {
  if (worker) {
    await worker.terminate()
    worker = null
  }
}