import React, { ReactNode } from 'react';

export interface Column<T> {
  key?: string;
  header: string;
  accessor?: string | ((row: T) => ReactNode);
  render?: (row: T) => ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

function LoadingSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} style={{ padding: '14px 16px' }}>
              <div style={{
                height: 14, borderRadius: 6,
                background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                width: `${60 + Math.random() * 30}%`,
              }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function DataTable<T extends Record<string, any>>({
  columns, data, loading = false, emptyMessage = 'No data found', onRowClick,
}: DataTableProps<T>) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={col.key ?? idx} style={{ width: col.width }}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <LoadingSkeleton cols={columns.length} />
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(row)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((col, j) => {
                  let cellContent: ReactNode = null;
                  if (col.render) {
                    cellContent = col.render(row);
                  } else if (typeof col.accessor === 'function') {
                    cellContent = col.accessor(row);
                  } else if (typeof col.accessor === 'string') {
                    cellContent = String(row[col.accessor] ?? '');
                  } else if (col.key) {
                    cellContent = String(row[col.key] ?? '');
                  }

                  return (
                    <td key={col.key ?? j}>
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
