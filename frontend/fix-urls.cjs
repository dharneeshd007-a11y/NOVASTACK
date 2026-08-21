const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Handle template literals: `http://localhost:5000/api...`
      content = content.replace(/`http:\/\/localhost:5000(\/.*?)`/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}$1`");
      
      // Handle simple strings: 'http://localhost:5000/api...'
      content = content.replace(/'http:\/\/localhost:5000(\/.*?)'/g, "(import.meta.env.VITE_API_URL || 'http://localhost:5000') + '$1'");

      // Handle raw URL in io()
      content = content.replace(/'http:\/\/localhost:5000'/g, "import.meta.env.VITE_API_URL || 'http://localhost:5000'");
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(path.join(__dirname, 'src'));
console.log('URLs replaced successfully.');
