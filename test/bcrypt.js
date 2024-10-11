const bcrypt = require('bcryptjs');
const password = '123';//yourPlainPassword
const hash = '$2a$12$w4ga8kPjd2hucPutuSPZZOIrJmQAyBAOYspETNn0SwdKZbb7gdi9e';//hashedPassword

bcrypt.compare(password, hash, (err, result) => {
  if (err) {
    console.error('Error comparing:', err);
  } else {
    console.log('Password match result:', result);  // Should log true if matched
  }
});

// 怎么用？
// 1. 安装bcryptjs
// 2. 引入bcryptjs
// 3. 使用bcryptjs的compare方法进行密码比较
// 怎么运行？
// 1. 进入test目录
// 2. 运行node bcrypt.js
