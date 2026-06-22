// Run once: node make-icons.js
// Generates solid green PNG icons in assets/ for the Office Add-in manifest.
const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

const R = 43, G = 90, B = 57; // #2b5a39 Longden green

function crc32(buf) {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        t[n] = c;
    }
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const lenBuf  = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const crcBuf  = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function makePNG(size) {
    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(size, 0);
    ihdr.writeUInt32BE(size, 4);
    ihdr[8]  = 8; // bit depth
    ihdr[9]  = 2; // RGB
    ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

    const rowSize = 1 + size * 3;
    const raw = Buffer.alloc(size * rowSize);
    for (let y = 0; y < size; y++) {
        const row = y * rowSize;
        raw[row] = 0; // filter: None
        for (let x = 0; x < size; x++) {
            const px = row + 1 + x * 3;
            raw[px] = R; raw[px + 1] = G; raw[px + 2] = B;
        }
    }

    const compressed = zlib.deflateSync(raw, { level: 9 });

    return Buffer.concat([
        sig,
        makeChunk('IHDR', ihdr),
        makeChunk('IDAT', compressed),
        makeChunk('IEND', Buffer.alloc(0))
    ]);
}

const dir = path.join(__dirname, 'assets');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

[16, 32, 64, 80, 128].forEach(size => {
    const file = path.join(dir, `icon-${size}.png`);
    fs.writeFileSync(file, makePNG(size));
    console.log(`Created assets/icon-${size}.png`);
});

console.log('Done.');
