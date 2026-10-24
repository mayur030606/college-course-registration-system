/**
 * Export data array to a downloadable CSV file.
 * 
 * @param {Array<Object>} data - Array of row objects
 * @param {string} filename - Desired filename (e.g. 'students.csv')
 * @param {Array<{key: string, label: string}>|Array<string>} [columns] - Optional column definitions or keys
 */
export const exportToCSV = (data, filename = 'export.csv', columns = null) => {
  if (!data || !data.length) {
    console.warn('No data available to export');
    return;
  }

  // Determine headers and access keys
  let headers = [];
  let keys = [];

  if (columns && columns.length > 0) {
    if (typeof columns[0] === 'string') {
      headers = columns;
      keys = columns;
    } else {
      headers = columns.map((col) => col.label || col.key);
      keys = columns.map((col) => col.key);
    }
  } else {
    keys = Object.keys(data[0]);
    headers = keys;
  }

  const escapeCSVValue = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    let stringVal = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    // Check if the value contains quotes, commas, or newlines
    if (stringVal.includes('"') || stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('\r')) {
      stringVal = `"${stringVal.replace(/"/g, '""')}"`;
    }
    return stringVal;
  };

  const csvRows = [];

  // Add header row
  csvRows.push(headers.map((h) => escapeCSVValue(h)).join(','));

  // Add data rows
  for (const row of data) {
    const rowValues = keys.map((key) => {
      // support nested keys like 'department.name'
      if (key.includes('.')) {
        const parts = key.split('.');
        let current = row;
        for (const part of parts) {
          if (current == null) break;
          current = current[part];
        }
        return escapeCSVValue(current);
      }
      return escapeCSVValue(row[key]);
    });
    csvRows.push(rowValues.join(','));
  }

  const csvString = csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default exportToCSV;
