const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Install canvas: npm install canvas
// If canvas fails, we'll use a simpler approach with base64 encoded images

const sizes = [
    { name: 'mdpi', size: 48, dir: 'mipmap-mdpi' },
    { name: 'hdpi', size: 72, dir: 'mipmap-hdpi' },
    { name: 'xhdpi', size: 96, dir: 'mipmap-xhdpi' },
    { name: 'xxhdpi', size: 144, dir: 'mipmap-xxhdpi' },
    { name: 'xxxhdpi', size: 192, dir: 'mipmap-xxxhdpi' }
];

function createEduLearnIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#007BFF');
    gradient.addColorStop(1, '#0056B3');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Book icon
    const bookSize = size * 0.6;
    const bookX = (size - bookSize) / 2;
    const bookY = (size - bookSize) / 2;

    // Book background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(bookX, bookY, bookSize, bookSize * 0.8);

    // Book binding
    ctx.fillStyle = '#E8F4FD';
    ctx.fillRect(bookX, bookY, bookSize * 0.1, bookSize * 0.8);

    // Book pages lines
    ctx.strokeStyle = '#007BFF';
    ctx.lineWidth = Math.max(1, size * 0.01);
    for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(bookX + bookSize * 0.15, bookY + bookSize * 0.15 * i);
        ctx.lineTo(bookX + bookSize * 0.85, bookY + bookSize * 0.15 * i);
        ctx.stroke();
    }

    return canvas.toBuffer('image/png');
}

function createRoundIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Circular background
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2, 0, 2 * Math.PI);
    const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    gradient.addColorStop(0, '#007BFF');
    gradient.addColorStop(1, '#0056B3');
    ctx.fillStyle = gradient;
    ctx.fill();

    // White circle for book
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/3, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Simple book representation
    const bookSize = size * 0.3;
    const bookX = (size - bookSize) / 2;
    const bookY = (size - bookSize) / 2;
    
    ctx.fillStyle = '#007BFF';
    ctx.fillRect(bookX, bookY, bookSize, bookSize * 0.8);
    
    ctx.fillStyle = '#FFFFFF';
    for (let i = 1; i <= 3; i++) {
        ctx.fillRect(bookX + bookSize * 0.1, bookY + bookSize * 0.15 * i, bookSize * 0.8, 2);
    }

    return canvas.toBuffer('image/png');
}

// Generate icons
sizes.forEach(({ name, size, dir }) => {
    try {
        const iconBuffer = createEduLearnIcon(size);
        const roundIconBuffer = createRoundIcon(size);
        
        const dirPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'res', dir);
        
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        
        fs.writeFileSync(path.join(dirPath, 'ic_launcher.png'), iconBuffer);
        fs.writeFileSync(path.join(dirPath, 'ic_launcher_round.png'), roundIconBuffer);
        
        console.log(`Created icons for ${name} (${size}x${size})`);
    } catch (error) {
        console.error(`Error creating ${name} icons:`, error.message);
    }
});

console.log('EduLearn app icons generated successfully!');
