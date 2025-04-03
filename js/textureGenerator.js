export function generateTexture(type, size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);

  switch (type) {
    case "wood":
      generateWoodTexture(ctx, size);
      break;
    case "stone":
      generateStoneTexture(ctx, size);
      break;
    case "brick":
      generateBrickTexture(ctx, size);
      break;
    case "sand":
      generateSandTexture(ctx, size);
      break;
    case "metal":
      generateMetalTexture(ctx, size);
      break;
    case "alien":
      generateAlienTexture(ctx, size);
      break;
    case "ice":
      generateIceTexture(ctx, size);
      break;
    case "lava":
      generateLavaTexture(ctx, size);
      break;
    case "neon":
      generateNeonTexture(ctx, size);
      break;
    case "coral":
      generateCoralTexture(ctx, size);
      break;
    case "modernUI":
      generateModernUITexture(ctx, size);
      break;
    case "marble":
      generateMarbleTexture(ctx, size);
      break;
    default:
      generateDefaultTexture(ctx, size);
  }

  return canvas;
}

function generateWoodTexture(ctx, size) {
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#8B4513");
  gradient.addColorStop(0.2, "#A05A2C");
  gradient.addColorStop(0.4, "#8B4513");
  gradient.addColorStop(0.6, "#A05A2C");
  gradient.addColorStop(0.8, "#8B4513");
  gradient.addColorStop(1, "#A05A2C");
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < size; i += 2) {
    const grainWidth = Math.random() * 3 + 1;
    const brightness = Math.random() * 20 - 10;

    const opacity = 0.05 + Math.random() * 0.15;
    ctx.strokeStyle = `rgba(139, 69, 19, ${opacity})`;
    ctx.lineWidth = grainWidth;

    ctx.beginPath();
    ctx.moveTo(0, i);

    for (let x = 0; x < size; x += size / 20) {
      const y = i + Math.sin(x * 0.02) * 5 + Math.cos(x * 0.01) * 3;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(size, i);
    ctx.stroke();
  }

  for (let i = 0; i < 8; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 25 + 8;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, "rgba(50, 25, 0, 0.8)");
    gradient.addColorStop(1, "rgba(139, 69, 19, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function generateStoneTexture(ctx, size) {
  ctx.fillStyle = "#888888";
  ctx.fillRect(0, 0, size, size);

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      if (Math.random() > 0.5) {
        const value = Math.random() * 30 - 15;
        ctx.fillStyle = `rgba(128, 128, 128, ${Math.random() * 0.05})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  for (let i = 0; i < 10; i++) {
    const startX = Math.random() * size;
    const startY = Math.random() * size;

    ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    let x = startX;
    let y = startY;
    const length = Math.random() * 100 + 50;

    for (let j = 0; j < length; j++) {
      x += Math.random() * 6 - 3;
      y += Math.random() * 6 - 3;
      ctx.lineTo(x, y);
    }

    ctx.stroke();
  }
}

function generateBrickTexture(ctx, size) {
  ctx.fillStyle = "#8B4513";
  ctx.fillRect(0, 0, size, size);

  const brickHeight = size / 10;
  const brickWidth = size / 5;
  const mortarSize = size / 50;

  for (let y = 0; y < size; y += brickHeight + mortarSize) {
    const offset =
      (Math.floor(y / (brickHeight + mortarSize)) % 2) * (brickWidth / 2);

    for (let x = -brickWidth / 2; x < size; x += brickWidth + mortarSize) {
      const r = 139 + Math.random() * 30 - 15;
      const g = 69 + Math.random() * 20 - 10;
      const b = 19 + Math.random() * 10 - 5;

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x + offset, y, brickWidth, brickHeight);

      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      for (let i = 0; i < 20; i++) {
        const spotX = x + offset + Math.random() * brickWidth;
        const spotY = y + Math.random() * brickHeight;
        const spotSize = Math.random() * 4 + 1;
        ctx.beginPath();
        ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.fillStyle = "#CCCCCC";

  for (let y = brickHeight; y < size; y += brickHeight + mortarSize) {
    ctx.fillRect(0, y, size, mortarSize);
  }

  for (let row = 0; row < Math.ceil(size / (brickHeight + mortarSize)); row++) {
    const offset = (row % 2) * (brickWidth / 2);

    for (let x = offset; x < size; x += brickWidth + mortarSize) {
      ctx.fillRect(
        x - mortarSize / 2,
        row * (brickHeight + mortarSize),
        mortarSize,
        brickHeight
      );
    }
  }
}

function generateSandTexture(ctx, size) {
  ctx.fillStyle = "#D2B48C";
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < (size * size) / 10; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const grainSize = Math.random() * 2 + 0.5;

    const brightness = Math.random() * 40 - 20;
    ctx.fillStyle = `rgba(210, 180, 140, ${Math.random() * 0.2})`;

    ctx.beginPath();
    ctx.arc(x, y, grainSize, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 200; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const spotSize = Math.random() * 4 + 1;

    ctx.fillStyle = "rgba(160, 120, 80, 0.2)";
    ctx.beginPath();
    ctx.arc(x, y, spotSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

function generateMetalTexture(ctx, size) {
  // Create a metallic gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#DDE0E3");
  gradient.addColorStop(0.5, "#BDC0C3");
  gradient.addColorStop(1, "#CDCFD3");
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Add fine brushed metal lines
  for (let i = 0; i < size; i += 1) {
    const variance = Math.random() * 10 - 5;
    const opacity = 0.03 + Math.random() * 0.03;
    ctx.strokeStyle = `rgba(180, 180, 190, ${opacity})`;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(0, i + variance);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // Add metal panel effect with subtle edging
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 2;
  ctx.strokeRect(5, 5, size - 10, size - 10);
  
  ctx.strokeStyle = "rgba(60, 60, 60, 0.3)";
  ctx.lineWidth = 2;
  ctx.strokeRect(7, 7, size - 14, size - 14);

  // Add some realistic reflections
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const length = Math.random() * 100 + 50;
    const angle = Math.random() * Math.PI;
    const width = Math.random() * 15 + 5;

    // Create a shiny highlight effect
    const highlightGradient = ctx.createLinearGradient(
      x, y,
      x + Math.cos(angle) * length, y + Math.sin(angle) * length
    );
    highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.01)");
    highlightGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.15)");
    highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0.01)");
    
    ctx.fillStyle = highlightGradient;
    
    // Draw a highlight streak
    ctx.beginPath();
    ctx.moveTo(x, y);
    const endX = x + Math.cos(angle) * length;
    const endY = y + Math.sin(angle) * length;
    
    // Create a rounded highlight shape
    const perpAngle = angle + Math.PI/2;
    ctx.moveTo(
      x + Math.cos(perpAngle) * width/2,
      y + Math.sin(perpAngle) * width/2
    );
    ctx.lineTo(
      endX + Math.cos(perpAngle) * width/2,
      endY + Math.sin(perpAngle) * width/2
    );
    ctx.lineTo(
      endX - Math.cos(perpAngle) * width/2,
      endY - Math.sin(perpAngle) * width/2
    );
    ctx.lineTo(
      x - Math.cos(perpAngle) * width/2,
      y - Math.sin(perpAngle) * width/2
    );
    ctx.closePath();
    ctx.fill();
  }
  
  // Add some small scratches
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const scratchLength = Math.random() * 15 + 5;
    const angle = Math.random() * Math.PI * 2;
    
    ctx.strokeStyle = "rgba(60, 60, 60, 0.1)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
      x + Math.cos(angle) * scratchLength,
      y + Math.sin(angle) * scratchLength
    );
    ctx.stroke();
  }
}

function generateAlienTexture(ctx, size) {
  ctx.fillStyle = "#1A472A";
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 20; i++) {
    const startX = Math.random() * size;
    const startY = Math.random() * size;

    ctx.strokeStyle = "rgba(0, 255, 0, 0.2)";
    ctx.lineWidth = Math.random() * 3 + 1;
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    let x = startX;
    let y = startY;
    const length = Math.random() * 100 + 50;

    for (let j = 0; j < length; j++) {
      x += Math.random() * 10 - 5;
      y += Math.random() * 10 - 5;
      ctx.lineTo(x, y);
    }

    ctx.stroke();
  }

  for (let i = 0; i < 30; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const spotSize = Math.random() * 10 + 5;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, spotSize);
    gradient.addColorStop(0, "rgba(0, 255, 100, 0.8)");
    gradient.addColorStop(1, "rgba(26, 71, 42, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, spotSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

function generateIceTexture(ctx, size) {
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#AADDFF");
  gradient.addColorStop(1, "#88CCFF");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 15; i++) {
    const startX = Math.random() * size;
    const startY = Math.random() * size;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = Math.random() * 2 + 0.5;
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    let x = startX;
    let y = startY;
    let branches = Math.floor(Math.random() * 5) + 3;

    createIceCrack(ctx, x, y, 50, 0, 3);
  }

  for (let i = 0; i < 50; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const spotSize = Math.random() * 5 + 1;

    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.beginPath();
    ctx.arc(x, y, spotSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

function createIceCrack(ctx, x, y, length, angle, depth) {
  if (depth <= 0) return;

  const endX = x + Math.cos(angle) * length;
  const endY = y + Math.sin(angle) * length;

  ctx.beginPath();
  ctx.moveTo(x, y);

  const segments = Math.floor(length / 10) + 1;
  let currentX = x;
  let currentY = y;

  for (let i = 1; i <= segments; i++) {
    const segX = x + (endX - x) * (i / segments) + (Math.random() * 4 - 2);
    const segY = y + (endY - y) * (i / segments) + (Math.random() * 4 - 2);
    ctx.lineTo(segX, segY);
    currentX = segX;
    currentY = segY;
  }

  ctx.stroke();

  if (depth > 1 && Math.random() > 0.3) {
    const branchAngle1 = angle + (Math.random() * Math.PI) / 4 + Math.PI / 8;
    const branchAngle2 = angle - (Math.random() * Math.PI) / 4 - Math.PI / 8;
    const branchLength = length * (0.4 + Math.random() * 0.3);

    createIceCrack(
      ctx,
      currentX,
      currentY,
      branchLength,
      branchAngle1,
      depth - 1
    );
    createIceCrack(
      ctx,
      currentX,
      currentY,
      branchLength,
      branchAngle2,
      depth - 1
    );
  }
}

function generateLavaTexture(ctx, size) {
  ctx.fillStyle = "#800000";
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 40; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const blobSize = Math.random() * 50 + 20;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, blobSize);
    gradient.addColorStop(0, "rgba(255, 100, 0, 0.8)");
    gradient.addColorStop(0.7, "rgba(200, 0, 0, 0.5)");
    gradient.addColorStop(1, "rgba(128, 0, 0, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, blobSize, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 30; i++) {
    const startX = Math.random() * size;
    const startY = Math.random() * size;

    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
    ctx.lineWidth = Math.random() * 3 + 1;
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    let x = startX;
    let y = startY;
    const length = Math.random() * 50 + 20;

    for (let j = 0; j < length; j++) {
      x += Math.random() * 6 - 3;
      y += Math.random() * 6 - 3;
      ctx.lineTo(x, y);
    }

    ctx.stroke();
  }
}

function generateNeonTexture(ctx, size) {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, size, size);

  const gridSize = size / 8;

  ctx.strokeStyle = "rgba(0, 200, 255, 0.7)";
  ctx.lineWidth = 2;

  for (let y = 0; y <= size; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  for (let x = 0; x <= size; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(0, 200, 255, 0.3)";
  ctx.lineWidth = 4;

  for (let y = 0; y <= size; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  for (let x = 0; x <= size; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }

  for (let x = 0; x <= size; x += gridSize) {
    for (let y = 0; y <= size; y += gridSize) {
      ctx.fillStyle = "rgba(0, 200, 255, 0.7)";
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(0, 200, 255, 0.2)";
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function generateCoralTexture(ctx, size) {
  ctx.fillStyle = "#FF6F61";
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 100; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 30 + 5;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

    const hue = 5 + Math.random() * 20;
    gradient.addColorStop(0, `hsla(${hue}, 80%, 70%, 0.7)`);
    gradient.addColorStop(0.7, `hsla(${hue}, 70%, 60%, 0.4)`);
    gradient.addColorStop(1, "rgba(255, 111, 97, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 500; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const holeSize = Math.random() * 3 + 1;

    ctx.fillStyle = "rgba(150, 50, 50, 0.4)";
    ctx.beginPath();
    ctx.arc(x, y, holeSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

function generateDefaultTexture(ctx, size) {
  ctx.fillStyle = "#888888";
  ctx.fillRect(0, 0, size, size);

  for (let x = 0; x < size; x += 2) {
    for (let y = 0; y < size; y += 2) {
      if (Math.random() > 0.5) {
        const value = Math.random() * 20 - 10;
        ctx.fillStyle = `rgba(128, 128, 128, ${Math.random() * 0.1})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }
}

// New modern UI texture
function generateModernUITexture(ctx, size) {
  // Create a sleek gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#1e293b"); // Dark slate blue
  gradient.addColorStop(1, "#0f172a"); // Darker slate blue
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Add subtle pattern
  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  for (let x = 0; x < size; x += 20) {
    for (let y = 0; y < size; y += 20) {
      if (Math.random() > 0.7) {
        const patternSize = 10 + Math.random() * 20;
        ctx.fillRect(x, y, patternSize, patternSize);
      }
    }
  }
  
  // Add glossy highlight
  const highlightGradient = ctx.createLinearGradient(0, 0, size, size/4);
  highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
  highlightGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.05)");
  highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  
  ctx.fillStyle = highlightGradient;
  ctx.fillRect(0, 0, size, size/3);
  
  // Add accent lines
  ctx.strokeStyle = "#38bdf8"; // Light blue accent
  ctx.lineWidth = 2;
  
  // Top accent line
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.lineTo(size, 10);
  ctx.globalAlpha = 0.7;
  ctx.stroke();
  
  // Bottom accent line
  ctx.beginPath();
  ctx.moveTo(0, size - 10);
  ctx.lineTo(size, size - 10);
  ctx.globalAlpha = 0.4;
  ctx.stroke();
  
  ctx.globalAlpha = 1.0;
  
  // Add some glowing dots for tech feel
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 4 + 1;
    
    const dotGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
    dotGradient.addColorStop(0, "rgba(56, 189, 248, 0.8)");
    dotGradient.addColorStop(0.5, "rgba(56, 189, 248, 0.3)");
    dotGradient.addColorStop(1, "rgba(56, 189, 248, 0)");
    
    ctx.fillStyle = dotGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// New marble texture
function generateMarbleTexture(ctx, size) {
  // Create base gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#f8f8f8");
  gradient.addColorStop(0.3, "#f0f0f0");
  gradient.addColorStop(0.7, "#e8e8e8");
  gradient.addColorStop(1, "#f5f5f5");
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Add marble veins
  for (let i = 0; i < 5; i++) {
    const startX = Math.random() * size;
    const startY = Math.random() * size;
    
    // Create a squiggly path for the vein
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    
    let x = startX;
    let y = startY;
    let veinLength = Math.random() * 300 + 200;
    
    // Random angle for the vein direction
    let angle = Math.random() * Math.PI * 2;
    
    for (let j = 0; j < veinLength; j++) {
      // Slightly change angle for organic feel
      angle += (Math.random() - 0.5) * 0.2;
      
      const stepLength = Math.random() * 2 + 1;
      x += Math.cos(angle) * stepLength;
      y += Math.sin(angle) * stepLength;
      
      // Keep vein within canvas bounds
      if (x < 0) x = 0;
      if (x > size) x = size;
      if (y < 0) y = 0;
      if (y > size) y = size;
      
      ctx.lineTo(x, y);
    }
    
    // Color the vein
    const veinColor = `rgba(180, 180, 180, ${0.1 + Math.random() * 0.1})`;
    ctx.strokeStyle = veinColor;
    ctx.lineWidth = Math.random() * 2 + 0.5;
    ctx.stroke();
    
    // Add secondary, thinner veins branching from the main one
    const branchPoints = Math.floor(Math.random() * 5) + 3;
    for (let k = 0; k < branchPoints; k++) {
      const branchX = startX + Math.random() * veinLength * 0.8;
      const branchY = startY + Math.random() * veinLength * 0.8;
      
      ctx.beginPath();
      ctx.moveTo(branchX, branchY);
      
      let branchLength = Math.random() * 100 + 50;
      let branchAngle = Math.random() * Math.PI * 2;
      
      for (let m = 0; m < branchLength; m++) {
        branchAngle += (Math.random() - 0.5) * 0.3;
        
        const branchStep = Math.random() * 1.5 + 0.5;
        const newX = branchX + Math.cos(branchAngle) * branchStep * m;
        const newY = branchY + Math.sin(branchAngle) * branchStep * m;
        
        if (newX < 0 || newX > size || newY < 0 || newY > size) break;
        
        ctx.lineTo(newX, newY);
      }
      
      ctx.strokeStyle = `rgba(200, 200, 200, ${0.05 + Math.random() * 0.05})`;
      ctx.lineWidth = Math.random() * 1 + 0.3;
      ctx.stroke();
    }
  }
  
  // Add subtle specular highlights
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 15 + 5;
    
    const highlightGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
    highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
