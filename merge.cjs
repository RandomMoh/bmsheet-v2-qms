const fs = require('fs');

const top = fs.readFileSync('src/pages/Admin_new.jsx', 'utf8');
const r1 = fs.readFileSync('src/pages/_admin_top.jsx', 'utf8');
const r2 = fs.readFileSync('src/pages/_admin_mid.jsx', 'utf8');
const r3 = fs.readFileSync('src/pages/_admin_bot.jsx', 'utf8');

fs.writeFileSync('src/pages/Admin.jsx', top + r1 + r2 + r3);

// cleanup
fs.unlinkSync('src/pages/Admin_new.jsx');
fs.unlinkSync('src/pages/_admin_top.jsx');
fs.unlinkSync('src/pages/_admin_mid.jsx');
fs.unlinkSync('src/pages/_admin_bot.jsx');
console.log('Merge complete!');
