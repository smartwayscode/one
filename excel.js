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




function updateRowWithValues(worksheet, jsonObject, dateFrom) {
  const nextRow = worksheet.lastRow ? worksheet.lastRow.number + 1 : 1;
  const row = worksheet.getRow(nextRow);
  row.values = Object.values(jsonObject);

}
// function updateRowWithValues(worksheet, jsonObject, isLowestPrice) {
//   const dateFrom = jsonObject.dateFrom;
//   const hotelName = jsonObject.hotelName;

//   // Manually find the existing row with the same date and hotel name
//   let existingRow = null;
//   worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
//     if (row.getCell('dateFrom').value === dateFrom && row.getCell('hotelName').value === hotelName) {
//       existingRow = row;
//       return false; // Stop iterating after finding the first match
//     }
//   });

//   if (existingRow) {
//     if (jsonObject.Price < existingRow.getCell('Price').value) {
//       // Update values for the existing row
//       existingRow.values = Object.values(jsonObject);
//       if (isLowestPrice) {
//         existingRow.fill = {
//           type: 'pattern',
//           pattern: 'solid',
//           fgColor: { argb: 'FFFF00' } // Yellow background color
//         };
//       } else {
//         // If it's not the lowest price, remove the background color
//         existingRow.fill = undefined;
//       }
//     } else {
//       return;
//     }
//   } else {
//     // If no existing row is found, add a new row
//     const nextRow = worksheet.lastRow ? worksheet.lastRow.number + 1 : 1;
//     const row = worksheet.getRow(nextRow);
//     row.values = Object.values(jsonObject);

//     if (isLowestPrice) {
//       row.fill = {
//         type: 'pattern',
//         pattern: 'solid',
//         fgColor: { argb: 'FFFF00' } // Yellow background color
//       };
//     }
//   }
// }




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
   const lowestPriceMap = new Map();
  const nextRow = worksheet.lastRow ? worksheet.lastRow.number + 1 : 1;

  jsonArray.forEach((jsonObject, index) => {
    const dateFrom = jsonObject.dateFrom;

    // Check if the date is already in the map and if the new price is lower
    if (lowestPriceMap.has(dateFrom)) {
      const currentLowestPrice = lowestPriceMap.get(dateFrom);
      if (jsonObject.Price < currentLowestPrice) {
        lowestPriceMap.set(dateFrom, jsonObject.Price);
        updateRowWithValues(worksheet, jsonObject, dateFrom); 
      }
    } else {
      // If the date is not in the map, add it with the current price
      lowestPriceMap.set(dateFrom, jsonObject.Price);
      updateRowWithValues(worksheet, jsonObject, dateFrom);
    }
  });
}
exports.appendJSONArrayToExcel = appendJSONArrayToExcel;

