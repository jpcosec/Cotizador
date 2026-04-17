/**
 * Service for exporting quotation data to Excel (CSV for now for zero dependencies).
 */

export function exportQuotationToCsv(validationRows, totals) {
  if (!validationRows || validationRows.length === 0) return;

  // 1. Prepare Header
  let csvContent = "data:text/csv;charset=utf-8,";
  
  // 2. Add validation rows
  csvContent += "Dia,Item,Pax,Unidades,Hora,Total\n";
  
  validationRows.forEach(row => {
    const line = [
      `Dia ${row.dayIndex}`,
      `"${row.name.replace(/"/g, '""')}"`,
      row.pax,
      row.unidades,
      row.hora,
      row.total
    ].join(",");
    csvContent += line + "\n";
  });

  // 3. Add Totals
  csvContent += "\n";
  csvContent += `,,,,,Subtotal,${totals.subtotal}\n`;
  csvContent += `,,,,,IVA,${totals.iva}\n`;
  csvContent += `,,,,,Total,${totals.total}\n`;

  // 4. Trigger download
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `cotizacion_${new Date().getTime()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
