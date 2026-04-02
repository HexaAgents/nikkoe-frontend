import ExcelJS from 'exceljs';

export interface ExportOptions<T> {
  /** Function to determine if a row should be styled as "voided" (red text) */
  isVoided?: (item: T) => boolean;
}

export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: string; header: string }[],
  filename: string,
  options?: ExportOptions<T>
) {
  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');

  // Set up columns
  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: 20,
  }));

  // Add rows
  data.forEach((item, index) => {
    const row: Record<string, unknown> = {};
    columns.forEach((col) => {
      row[col.key] = item[col.key] ?? '';
    });
    const excelRow = worksheet.addRow(row);
    
    // Style voided rows with red text
    if (options?.isVoided?.(item)) {
      excelRow.eachCell((cell) => {
        cell.font = { color: { argb: 'FFDC2626' } }; // Red color
      });
    }
  });

  // Style header row
  worksheet.getRow(1).font = { bold: true };

  // Generate filename with date
  const date = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${date}.xlsx`;

  // Generate buffer and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fullFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
