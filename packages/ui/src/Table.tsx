import { type ReactNode } from 'react';

import { cx } from './lib/cx';

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: ReadonlyArray<TableColumn<T>>;
  rows: ReadonlyArray<T>;
  getRowKey: (row: T) => string;
  empty?: ReactNode;
  caption?: string;
  className?: string;
}

export function Table<T>({ columns, rows, getRowKey, empty, caption, className }: TableProps<T>) {
  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <div
      className={cx(
        'overflow-x-auto rounded-card border border-surface-highest bg-surface-lowest',
        className,
      )}
    >
      <table className="min-w-full border-collapse text-left text-body-md">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="border-b border-surface-highest bg-surface-low">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cx(
                  'whitespace-nowrap px-4 py-3 text-label-md uppercase tracking-[0.06em] text-on-surface-variant',
                  column.className,
                )}
                scope="col"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="border-b border-surface-highest last:border-b-0">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cx(
                    'whitespace-nowrap px-4 py-3 align-middle text-on-surface',
                    column.className,
                  )}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
