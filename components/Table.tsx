import React, { useState, useMemo } from 'react';
import { TableColumn, TableProps } from '../types'; // Assuming types are moved to types.ts or updated here
import SkeletonLoader from './SkeletonLoader';
import { TableCellsIcon, ArrowUpIcon, ArrowDownIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from '../constants';

const Table = <T extends object,>(
  { columns, data, isLoading, emptyStateMessage = "No data available.", emptyStateIcon, itemsPerPage = 0 }: TableProps<T> // Added itemsPerPage
) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof T | ((item: T) => React.ReactNode) | null; direction: 'ascending' | 'descending' } | null>(null);
  const [filterTerm, setFilterTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!filterTerm) return data;
    return data.filter(item =>
      columns.some(col => {
        const value = typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessor as keyof T];
        return String(value).toLowerCase().includes(filterTerm.toLowerCase());
      })
    );
  }, [data, filterTerm, columns]);

  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig !== null && sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const valA = typeof sortConfig.key === 'function' ? sortConfig.key(a) : a[sortConfig.key as keyof T];
        const valB = typeof sortConfig.key === 'function' ? sortConfig.key(b) : b[sortConfig.key as keyof T];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'ascending' ? valA - valB : valB - valA;
        }
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'ascending' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        // Fallback for other types or mixed types (simple comparison)
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);
  
  const paginatedData = useMemo(() => {
    if (itemsPerPage <= 0) return sortedData; // No pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = itemsPerPage > 0 ? Math.ceil(filteredData.length / itemsPerPage) : 1;


  const requestSort = (key: keyof T | ((item: T) => React.ReactNode)) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page on sort
  };

  const renderCellContent = (item: T, column: TableColumn<T>) => {
    if (column.render) return column.render(item);
    if (typeof column.accessor === 'function') return column.accessor(item);
    const value = item[column.accessor as keyof T];
    if (value instanceof Date) return value.toLocaleString();
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value ?? '');
  };
  
  if (isLoading) {
    return (
      <div className="bg-secondary-dark rounded-lg shadow-xl p-4 overflow-hidden">
        {/* Optional: Filter placeholder while loading */}
        {/* <SkeletonLoader type="line" className="h-10 w-1/3 mb-4" /> */}
        {[...Array(itemsPerPage > 0 ? itemsPerPage : 5)].map((_, i) => (
          <div key={i} className={`flex space-x-4 py-3 ${i < (itemsPerPage > 0 ? itemsPerPage : 5) -1 ? 'border-b border-tertiary-dark' : ''}`}>
            {columns.map((col, colIdx) => (
              <SkeletonLoader key={colIdx} type="line" className={`h-4 ${colIdx === 0 ? 'w-1/4' : colIdx === columns.length - 1 ? 'w-1/6' : 'w-1/3'}`} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-secondary-dark rounded-lg shadow-xl">
      <div className="p-4 flex justify-between items-center">
        <div className="relative w-full max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="w-5 h-5 text-text-secondary" />
          </div>
          <input
            type="text"
            placeholder="Filter table..."
            value={filterTerm}
            onChange={(e) => {
              setFilterTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on filter
            }}
            className="input-field pl-10 py-2 text-sm w-full"
          />
        </div>
        {/* Placeholder for potential future actions like "Export" */}
      </div>
      
      {paginatedData.length === 0 && !isLoading ? (
         <div className="text-center py-10 text-text-secondary">
          {emptyStateIcon || <TableCellsIcon className="w-12 h-12 mx-auto mb-3 opacity-50"/>}
          <p>{filterTerm ? `No results found for "${filterTerm}".` : emptyStateMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-tertiary-dark">
            <thead className="bg-tertiary-dark/50">
              <tr>
                {columns.map((col, index) => (
                  <th
                    key={index}
                    scope="col"
                    className={`px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:bg-tertiary-dark' : ''} ${col.className || ''}`}
                    onClick={() => col.sortable && requestSort(col.accessor)}
                  >
                    <div className="flex items-center">
                      {col.header}
                      {col.sortable && sortConfig?.key === col.accessor && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
                        </span>
                      )}
                       {col.sortable && sortConfig?.key !== col.accessor && ( // Dimmed placeholder for unsorted sortable columns
                        <span className="ml-1 opacity-30">
                          <ArrowUpIcon className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-tertiary-dark">
              {paginatedData.map((item, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-tertiary-dark/30 transition-colors duration-150">
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className={`px-6 py-4 whitespace-nowrap text-sm text-text-primary ${col.className || ''}`}>
                      {renderCellContent(item, col)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {itemsPerPage > 0 && totalPages > 1 && (
        <div className="p-4 flex items-center justify-between border-t border-tertiary-dark">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="btn-secondary text-sm"
          >
            <ChevronLeftIcon className="w-5 h-5 mr-1 inline"/> Previous
          </button>
          <span className="text-sm text-text-secondary">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="btn-secondary text-sm"
          >
            Next <ChevronRightIcon className="w-5 h-5 ml-1 inline"/>
          </button>
        </div>
      )}
    </div>
  );
};

export default Table;