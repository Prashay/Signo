const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

// Ensure target directories exist
const buildDir = path.resolve(__dirname, '..', 'build')
const publicDir = path.resolve(__dirname, '..', 'public')
if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true })
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })

// Helper: compute CRC32 table
const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  crcTable[n] = c >>> 0
}

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function createChunk(type, data) {
  const len = data.length
  const buf = Buffer.alloc(12 + len)
  buf.writeUInt32BE(len, 0)
  buf.write(type, 4, 4, 'ascii')
  data.copy(buf, 8)
  const toCrc = buf.subarray(4, 8 + len)
  buf.writeUInt32BE(crc32(toCrc), 8 + len)
  return buf
}

// Generate high-resolution 512x512 RGBA PNG icon for Signo Studio
function generateSignoIcon(size = 512) {
  const rawData = Buffer.alloc((size * 4 + 1) * size)
  const center = size / 2
  const squircleRadius = size * 0.44
  const cornerRadius = size * 0.22

  for (let y = 0; y < size; y++) {
    const rowOffset = y * (size * 4 + 1)
    rawData[rowOffset] = 0 // Filter type: None

    for (let x = 0; x < size; x++) {
      const pxOffset = rowOffset + 1 + x * 4

      // Distance from center
      const dx = Math.abs(x - center)
      const dy = Math.abs(y - center)

      // Squircle distance formula (superellipse)
      const nx = dx / squircleRadius
      const ny = dy / squircleRadius
      const superDist = Math.pow(Math.pow(nx, 4.4) + Math.pow(ny, 4.4), 1 / 4.4)

      if (superDist > 1.02) {
        // Transparent outside squircle
        rawData[pxOffset] = 0
        rawData[pxOffset + 1] = 0
        rawData[pxOffset + 2] = 0
        rawData[pxOffset + 3] = 0
        continue
      }

      // Edge anti-aliasing
      let alpha = 255
      if (superDist > 0.98) {
        alpha = Math.round(255 * (1 - (superDist - 0.98) / 0.04))
      }

      // Metallic rim border
      const isRim = superDist >= 0.92 && superDist <= 1.0
      const rimHighlight = 0.5 + 0.5 * Math.sin(((x - y) / size) * Math.PI)

      if (isRim) {
        const rimIntensity = Math.round(180 + 70 * rimHighlight)
        rawData[pxOffset] = Math.round(rimIntensity * 0.75) // R
        rawData[pxOffset + 1] = Math.round(rimIntensity * 0.8) // G
        rawData[pxOffset + 2] = Math.round(rimIntensity * 0.95) // B
        rawData[pxOffset + 3] = alpha
        continue
      }

      // Interior: Dark Obsidian Glass with ambient violet glow
      const distFromCenter = Math.sqrt(Math.pow(x - center, 2) + Math.pow(y - center, 2)) / center
      let r = Math.round(10 + (1 - distFromCenter) * 16)
      let g = Math.round(12 + (1 - distFromCenter) * 20)
      let b = Math.round(20 + (1 - distFromCenter) * 45)

      // Draw Signo "S" stream curves
      // S-curve parametric distance
      const normX = (x - center) / (size * 0.32)
      const normY = (y - center) / (size * 0.32)

      // Top arc: centered at (0, -0.45)
      const distTopArc = Math.abs(Math.sqrt(Math.pow(normX - 0.05, 2) + Math.pow(normY + 0.42, 2)) - 0.48)
      // Bottom arc: centered at (0, 0.45)
      const distBotArc = Math.abs(Math.sqrt(Math.pow(normX + 0.05, 2) + Math.pow(normY - 0.42, 2)) - 0.48)
      // Diagonal connector
      const distDiagonal = Math.abs(normX * 1.1 + normY * 0.9)

      let sDist = 999
      if (normY < -0.1) {
        sDist = distTopArc
      } else if (normY > 0.1) {
        sDist = distBotArc
      } else {
        sDist = Math.min(distTopArc, distBotArc, distDiagonal)
      }

      // Glowing Stream intensity
      if (sDist < 0.35) {
        const intensity = Math.pow(1 - sDist / 0.35, 1.8)
        // Gradient along Y: Cyan at bottom, Indigo in middle, Magenta/Pink at top
        const gradT = (normY + 1) / 2 // 0 at top, 1 at bottom
        const glowR = Math.round(236 * (1 - gradT) + 56 * gradT)
        const glowG = Math.round(72 * (1 - gradT) + 189 * gradT)
        const glowB = Math.round(153 * (1 - gradT) + 248 * gradT)

        r = Math.min(255, Math.round(r + glowR * intensity))
        g = Math.min(255, Math.round(g + glowG * intensity))
        b = Math.min(255, Math.round(b + glowB * intensity))
      }

      // Central core neon dot at (-0.22, 0.72)
      const dotDist = Math.sqrt(Math.pow(normX + 0.32, 2) + Math.pow(normY - 0.65, 2))
      if (dotDist < 0.2) {
        const dotIntensity = Math.pow(1 - dotDist / 0.2, 2)
        r = Math.min(255, Math.round(r + 255 * dotIntensity))
        g = Math.min(255, Math.round(g + 255 * dotIntensity))
        b = Math.min(255, Math.round(b + 255 * dotIntensity))
      }

      // Specular glass shine across upper quadrant
      if (y < center && (x + y < size * 0.75)) {
        const shine = Math.pow(1 - (x + y) / (size * 0.75), 2) * 45
        r = Math.min(255, Math.round(r + shine))
        g = Math.min(255, Math.round(g + shine))
        b = Math.min(255, Math.round(b + shine * 1.2))
      }

      rawData[pxOffset] = r
      rawData[pxOffset + 1] = g
      rawData[pxOffset + 2] = b
      rawData[pxOffset + 3] = alpha
    }
  }

  // Compress with zlib
  const compressed = zlib.deflateSync(rawData, { level: 9 })

  // Construct PNG
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  // IHDR chunk
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // Bit depth
  ihdr[9] = 6 // Color type: RGBA
  ihdr[10] = 0 // Compression
  ihdr[11] = 0 // Filter
  ihdr[12] = 0 // Interlace

  const ihdrChunk = createChunk('IHDR', ihdr)
  const idatChunk = createChunk('IDAT', compressed)
  const iendChunk = createChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk])
}

console.log('[IconGen] Generating 512x512 Signo app icon PNG...')
const pngBuffer = generateSignoIcon(512)

const buildIconPath = path.join(buildDir, 'icon.png')
const publicIconPath = path.join(publicDir, 'icon.png')

fs.writeFileSync(buildIconPath, pngBuffer)
fs.writeFileSync(publicIconPath, pngBuffer)

console.log(`[IconGen] Saved to ${buildIconPath}`)
console.log(`[IconGen] Saved to ${publicIconPath}`)

// Also check if an AI-rendered high-res asset exists in .gemini artifacts
const brainDir = 'C:\\Users\\prashant jha\\.gemini\\antigravity-ide\\brain\\b95491da-2a65-4610-b76b-301c76166e3f'
if (fs.existsSync(brainDir)) {
  const files = fs.readdirSync(brainDir).filter(f => f.startsWith('signo_dock_icon') && f.endsWith('.jpg'))
  if (files.length > 0) {
    const srcFile = path.join(brainDir, files[files.length - 1])
    const destJpg = path.join(buildDir, 'icon-artwork.jpg')
    fs.copyFileSync(srcFile, destJpg)
    console.log(`[IconGen] Copied high-res artwork to ${destJpg}`)
  }
}
