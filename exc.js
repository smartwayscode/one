const ExcelJS = require('exceljs');
const fs = require('fs');
function appendJSONArrayToExcel(filePath, worksheetName, jsonArray) {
  const workbook = new ExcelJS.Workbook();

  // Check if the file exists
  if (fs.existsSync(filePath)) {
    workbook.xlsx.readFile(filePath)
      .then(() => {
        const worksheet = workbook.getWorksheet(worksheetName) || workbook.addWorksheet(worksheetName);
        appendJSONObjectsToWorksheet(worksheet, jsonArray);
        
        // Format the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 16 };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 30;
    headerRow.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'c20063' },
    };

    // Set auto-filter
    worksheet.autoFilter = `A1:${String.fromCharCode(64 + worksheet.columns.length)}1`;
    
        worksheet.eachRow(function (row, rowNumber) {
        row.eachCell(function (cell, colNumber) {
        if (cell.value)
          row.getCell(colNumber).alignment = { vertical: 'middle', horizontal: 'center' };
      });
        });
        return workbook.xlsx.writeFile(filePath);
      })
      .then(() => {
        // console.log('JSON array appended to the existing file successfully!');
      })
      .catch((error) => {
        console.error('Error:', error);
      });

  } else {
    const worksheet = workbook.addWorksheet(worksheetName);
    appendJSONObjectsToWorksheet(worksheet, jsonArray);

    // Format the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 16 };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 30;
    headerRow.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'c20063' },
    };

    // Set auto-filter
    worksheet.autoFilter = `A1:${String.fromCharCode(64 + worksheet.columns.length)}1`;
    
    worksheet.eachRow(function (row, rowNumber) {
      row.eachCell(function (cell, colNumber) {
        if (cell.value)
          row.getCell(colNumber).alignment = { vertical: 'middle', horizontal: 'center' };
      });
    });
        workbook.xlsx.writeFile(filePath)
      .then(() => {
        // console.log('New file created and JSON array added successfully!');
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }
}

function appendJSONObjectsToWorksheet(worksheet, jsonArray) {
  // Determine the next available row
 const columns = [
   { header: 'Hotel Name', key: 'hotelName', width: 50 },
    { header: 'Stars', key: 'stars', width: 10 , type: 'number' },
    { header: 'Price', key: 'Price', width: 15, type: 'number' },
    { header: 'Hotel Place', key: 'hotelPlace', width: 20 },
    { header: 'From', key: 'from', width: 15 },
    { header: 'To', key: 'to', width: 15 },
    { header: 'Date From', key: 'dateFrom', width: 20, style: { numFmt: 'dd-mm-yyyy' } },
    { header: 'Date To', key: 'dateTo', width: 20, style: { numFmt: 'dd-mm-yyyy' } },
    { header: 'Nights', key: 'nights', width: 15  },
    { header: 'Discount', key: 'nights', width: 15 , type: 'number' },
  ];
   worksheet.columns = columns;

  const nextRow = worksheet.lastRow ? worksheet.lastRow.number + 1 : 1;

  jsonArray.forEach((jsonObject, index) => {
    const row = worksheet.getRow(nextRow + index);
    row.values = Object.values(jsonObject);
  });
}
exports.appendJSONArrayToExcel = appendJSONArrayToExcel;
