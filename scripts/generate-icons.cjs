#!/usr/bin/env node
/**
 * Generates PWA icons for RestoPros Cotizador.
 * Blue circle (#2196F3) with white "RP" text.
 *
 * Usage: node scripts/generate-icons.js
 * Requires: npm install canvas  (only needed if re-generating icons)
 */

const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "../public/icons");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Blue circle background
  ctx.fillStyle = "#2196F3";
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  // White "RP" text
  const fontSize = Math.round(size * 0.32);
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("RP", size / 2, size / 2);

  return canvas.toBuffer("image/png");
}

const sizes = [192, 512];
for (const size of sizes) {
  const buf = generateIcon(size);
  const outPath = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(outPath, buf);
  console.log(`✓ Written ${outPath} (${size}×${size}px)`);
}
