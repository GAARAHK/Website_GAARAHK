/**
 * seed.js — 首次部署时运行，用于初始化管理员密码
 * 用法：node seed.js <你的密码>
 * 示例：node seed.js mySecurePassword123
 */
const bcrypt = require('bcryptjs');
const db = require('./db');

const password = process.argv[2];
if (!password) {
  console.error('用法: node seed.js <管理员密码>');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);

db.prepare('INSERT OR REPLACE INTO admin (id, password_hash) VALUES (1, ?)').run(hash);
console.log('✅ 管理员密码已设置/更新成功！');
process.exit(0);
