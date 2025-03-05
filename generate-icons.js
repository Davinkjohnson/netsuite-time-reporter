const fs = require('fs');
const { createCanvas } = require('canvas');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconDir = 'icons';

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir);
}

// Generate icons for each size
sizes.forEach(size => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.fillStyle = '#007bff';
    ctx.fillRect(0, 0, size, size);

    // Draw clock icon
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/3, 0, 2 * Math.PI);
    ctx.fill();

    // Draw clock hands
    ctx.fillStyle = '#007bff';
    ctx.fillRect(size/2 - 2, size/2 - size/4, 4, size/2); // Hour hand
    ctx.fillRect(size/2 - 1, size/2 - size/3, 2, size/2); // Minute hand

    // Save the icon
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`${iconDir}/icon-${size}x${size}.png`, buffer);
});

console.log('Icons generated successfully!'); 