// 集中式错误处理工具

function handleDbError(err, res, context = '操作') {
  console.error(`${context}错误:`, err);

  // MySQL 唯一键冲突
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({ message: '数据已存在，请检查输入' });
  }

  // MySQL 外键约束
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ message: '关联数据不存在' });
  }

  // MySQL 连接错误
  if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
    return res.status(503).json({ message: '服务暂时不可用，请稍后重试' });
  }

  return res.status(500).json({ message: `${context}失败，请稍后重试` });
}

module.exports = { handleDbError };
