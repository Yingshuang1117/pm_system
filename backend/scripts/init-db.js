const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  let connection;
  try {
    console.log('正在连接数据库...');
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root'
    });
    console.log('数据库连接成功');

    // 读取 SQL 文件
    console.log('正在读取 SQL 文件...');
    const sqlPath = path.join(__dirname, 'init-db.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');
    console.log('SQL 文件读取成功');

    // 分割并执行 SQL 语句
    console.log('正在执行 SQL 语句...');
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    for (let statement of statements) {
      if (statement.trim()) {
        console.log('执行 SQL:', statement.trim());
        try {
          await connection.query(statement);
          console.log('SQL 执行成功');
        } catch (error) {
          console.error('SQL 执行失败:', error);
          throw error;
        }
      }
    }

    // 更新管理员密码
    console.log('正在更新管理员密码...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.query(
      'UPDATE users SET password = ? WHERE username = ?',
      [hashedPassword, 'admin']
    );
    console.log('管理员密码更新成功');

    console.log('数据库初始化成功！');
    console.log('默认管理员账号：admin');
    console.log('默认管理员密码：admin123');

  } catch (error) {
    console.error('数据库初始化失败：', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

initializeDatabase(); 