const fs = require('fs');
function generateDailyLinksUntilOctoberWith8Days() {
    const currentDate = new Date();
  
    // Array to store formatted links
    const links = [];
  
    let currentDay = new Date(currentDate);
  
    // Loop until October
    while (currentDay.getMonth() <= 9) { // Month is zero-based (0-11), so October is 9
      const formattedDate = formatDate(currentDay);
      const endDate = new Date(currentDay);
      endDate.setDate(currentDay.getDate() + 8); // Change 7 to 8 for an 8-day interval
  
      const formattedEndDate = formatDate(endDate);
  
      // Generate the link with the formatted dates
      const link = `https://www.kartagotours.hu/keresesi-eredmenyek?d=63252|63447&dd=${formattedDate}&nn=7|8|9|10|11|12|13|14&rd=${formattedEndDate}&to=489|4371&tt=1`;
        
      links.push(link);
  
      currentDay.setDate(currentDay.getDate() + 1); // Generate links for each day
    }
  
    // Return the generated links
    return links;
  }
  function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();
  
    return `${year}-${month}-${day}`;
  }
  function generateDailyLinksFromMay30UntilOctoberWith8Days() {
    // Set the initial date to May 30th of the current year
    const initialDate = new Date(new Date().getFullYear(), 4, 1); // Month is zero-based, so May is 4
  
    // Array to store formatted links
    const links = [];
  
    let currentDay = new Date(initialDate);
  
    // Loop until October
    while (currentDay.getMonth() <= 9) { // Month is zero-based (0-11), so October is 9
      const formattedDate = formatDate(currentDay);
      const endDate = new Date(currentDay);
      endDate.setDate(currentDay.getDate() + 8); // Change 7 to 8 for an 8-day interval
  
      const formattedEndDate = formatDate(endDate);
  
      // Generate the link with the formatted dates
      const link = `https://www.kartagotours.hu/keresesi-eredmenyek?d=63252|63447&dd=${formattedDate}&nn=7|8|9|10|11|12|13|14&rd=${formattedEndDate}&to=489|4371&tt=1`;
  
      links.push(link);
  
      currentDay.setDate(currentDay.getDate() + 1); // Generate links for each day
    }
  
    // Return the generated links
    return links;
  }
  
  function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();
  
    return `${year}-${month}-${day}`;
  }
  
  // Example usage
  const result = generateDailyLinksFromMay30UntilOctoberWith8Days();
  console.log(result);
  
  // Example usage
  // const result = generateDailyLinksUntilOctoberWith8Days();
  // console.log(result);
  
  fs.appendFile(`loop.json`, JSON.stringify(result , null, 2), function (err) { })
  