import React from 'react';
import './ui.css';

const DataTable = ({ columns = [], rows = [], emptyText = 'No data available.' }) => {
  return (
    <div className="ui-table-wrap">
      <table className="ui-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="ui-table-empty" colSpan={Math.max(columns.length, 1)}>
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={row.id || idx}>
                {columns.map((col) => (
                  <td key={`${col.key}-${idx}`}>
                    {typeof col.render === 'function' ? col.render(row, idx) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
