const pool = require('../config/database');

async function getConnection() {
  return await pool.getConnection();
}

async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function findOne(sql, params) {
  const rows = await query(sql, params);
  return rows[0];
}

async function insert(table, data) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => '?').join(',');
  
  const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;
  const [result] = await pool.execute(sql, values);
  return result;
}

async function update(table, data, where) {
  const sets = Object.keys(data).map(key => `${key} = ?`).join(',');
  const values = [...Object.values(data), ...Object.values(where)];
  const conditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
  
  const sql = `UPDATE ${table} SET ${sets} WHERE ${conditions}`;
  const [result] = await pool.execute(sql, values);
  return result;
}

async function remove(table, where) {
  const conditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
  const values = Object.values(where);
  
  const sql = `DELETE FROM ${table} WHERE ${conditions}`;
  const [result] = await pool.execute(sql, values);
  return result;
}

// 事务相关方法
async function beginTransaction(connection) {
  await connection.beginTransaction();
}

async function commit(connection) {
  await connection.commit();
}

async function rollback(connection) {
  await connection.rollback();
}

async function releaseConnection(connection) {
  connection.release();
}

module.exports = {
  query,
  findOne,
  insert,
  update,
  remove,
  getConnection,
  beginTransaction,
  commit,
  rollback,
  releaseConnection
}; 