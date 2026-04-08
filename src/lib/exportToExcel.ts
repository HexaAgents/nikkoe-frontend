export interface ExportOptions<T> {
  isVoided?: (item: T) => boolean;
}

export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: string; header: string }[],
  filename: string,
  options?: ExportOptions<T>
) {
  const ExcelJS = (await import('exceljs')).default;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');

  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: 20,
  }));

  data.forEach((item) => {
    const row: Record<string, unknown> = {};
    columns.forEach((col) => {
      row[col.key] = item[col.key] ?? '';
    });
    const excelRow = worksheet.addRow(row);

    if (options?.isVoided?.(item)) {
      excelRow.eachCell((cell) => {
        cell.font = { color: { argb: 'FFDC2626' } };
      });
    }
  });

  worksheet.getRow(1).font = { bold: true };

  const date = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${date}.xlsx`;

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
