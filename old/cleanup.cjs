const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

// Fix duplicate dark:border-gray-800
content = content.replace(/dark:border-gray-800 dark:border-gray-800/g, 'dark:border-gray-800');

// Add dark:bg-gray-900 to bg-white if not already there
// We use a regex that matches bg-white not followed by dark:bg
content = content.replace(/bg-white(?!\s+dark:bg-)/g, 'bg-white dark:bg-gray-900');

// Same for bg-gray-50
content = content.replace(/bg-gray-50(?!\s+dark:bg-)/g, 'bg-gray-50 dark:bg-gray-800/50');

// Fix text-black
content = content.replace(/text-black(?!\s+dark:text-)/g, 'text-black dark:text-gray-100');

fs.writeFileSync('App.tsx', content);
console.log('Clean up done.');
