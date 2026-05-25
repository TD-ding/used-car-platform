import React from 'react';

export default function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;

  const pagesArr = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - 2 && i <= page + 2)) {
      pagesArr.push(i);
    } else if (pagesArr[pagesArr.length - 1] !== '...') {
      pagesArr.push('...');
    }
  }

  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>上一页</button>
      {pagesArr.map((p, i) => (
        <button
          key={i}
          className={p === page ? 'active' : ''}
          disabled={p === '...'}
          onClick={() => typeof p === 'number' && onPageChange(p)}
        >
          {p}
        </button>
      ))}
      <button disabled={page >= pages} onClick={() => onPageChange(page + 1)}>下一页</button>
    </div>
  );
}
