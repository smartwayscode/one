// Final working code for the project
const path = require('path');
const fs = require('fs');
const { Cluster } = require('puppeteer-cluster');
const { appendJSONArrayToExcel } = require('./excel');  
const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}; 

(async () => {

  let periodText = "July-August 2024";
  let count = 0;

  const pathToExtension1 = path.join(process.cwd(), 'cookie-blocker');
  const cluster1 = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 1, 
    timeout: 1200000,
    sameDomainDelay: 5000,
    workerCreationDelay: 5000 , 
    monitor: true,
    puppeteerOptions: {
      protocolTimeout: 1200000,
      headless: false,
      defaultViewport: null,
      args: [
        '--no-sandbox', '--disable-setuid-sandbox',
        '--start-maximized', 
        `--disable-extensions-except=${pathToExtension1}`,
        `--load-extension=${pathToExtension1}`,
            '--enable-automation'
        ]
      },
  });
  const cluster2 = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    executablePath: '/usr/bin/chromium-browser',
    maxConcurrency: 1,
    timeout: 1200000,
    sameDomainDelay: 5000,
    // monitor: true, 
    workerCreationDelay: 5000,
    puppeteerOptions: {
      // executablePath: '/usr/bin/chromium-browser',
      protocolTimeout: 1200000,
      headless: false,
      defaultViewport: null,
      args: [
        '--no-sandbox', '--disable-setuid-sandbox',  '--no-sandbox',
        '--disable-gpu',
        '--start-maximized',
        `--disable-extensions-except=${pathToExtension1}`,
        `--load-extension=${pathToExtension1}`,
            '--enable-automation'
        ]
      },
  });
  const cluster3 = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    executablePath: '/usr/bin/chromium-browser',
    maxConcurrency: 2,
    timeout: 1200000,
    sameDomainDelay: 5000,
    // monitor: true, 
    workerCreationDelay: 5000,
    puppeteerOptions: {
      // executablePath: '/usr/bin/chromium-browser',
      protocolTimeout: 1200000,
      headless: false,
      defaultViewport: null,
      args: [
        '--no-sandbox', '--disable-setuid-sandbox',  '--no-sandbox',
        '--disable-gpu',
        '--start-maximized',
        `--disable-extensions-except=${pathToExtension1}`,
        `--load-extension=${pathToExtension1}`,
            '--enable-automation'
        ]
      },
  });

  
  cluster1.on('taskerror', (err, data, willRetry) => {
      if (willRetry) {
        console.warn(`Encountered an error while crawling ${data}. ${err.message}\nThis job will be retried`);
      } else {
        console.error(`Failed to crawl ${data}: ${err.message}`);
      }
    });

  cluster2.on('taskerror', (err, data, willRetry) => {
      if (willRetry) {
        console.warn(`Encountered an error while crawling ${data}. ${err.message}\nThis job will be retried`);
      } else {
        console.error(`Failed to crawl ${data}: ${err.message}`);
      }
    });
    cluster3.on('taskerror', (err, data, willRetry) => {
        if (willRetry) {
          console.warn(`Encountered an error while crawling ${data}. ${err.message}\nThis job will be retried`);
        } else {
          console.error(`Failed to crawl ${data}: ${err.message}`);
        }
      });
    
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
      
      async function processLink(page, url) {
        // Navigate to the URL
        
      }
      
  await cluster1.task(async ({ page }) => {
    try {    
        links = generateDailyLinksFromMay30UntilOctoberWith8Days();
        for(let i = 0; i < links.length; i++) {
            console.log(links[i])
            await cluster3.queue(links[i]);
            await cluster3.waitForOne()
            await cluster3.idle()
            }
    } catch (err) {
        console.log(err);
    }
  });

  await cluster3.task(async ({ page, data: url }) => {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
        const element = await page.$(".f_searchResult-content");
        
        if (element !== null) {
            await page.waitForSelector('.f_searchResult-content',  { visible: true });
            const hotelsurls = []
            let isBtnEnabled = (await page.$('.f_searchResult-content-item')) !== null;
            while (isBtnEnabled) {
                const offersHandler = await page.$$('.f_searchResult-content-item');
                for (const offer of offersHandler) { 
                  try {
                    const hotelurl = await page.evaluate(offer => offer.querySelector('div.f_tile-item.f_tile-item--content > div > div.f_box > p > a').href, offer);
                    hotelsurls.push(hotelurl)
                    try {
                      // fs.appendFile('resulturls1.json', JSON.stringify(hotelurl, null, 2), function (err) { })
                      await cluster2.queue(hotelurl);
                      await cluster2.waitForOne()
                      // cluster2.waitForOneIdle()
                      await cluster2.idle()
                    } catch (error) {
                      console.log(error)
                    }
                    // cluster2.close()
                    // page.goto(hotelurl, { waitUntil: 'networkidle2' });
                    // await page.waitForSelector('.f_hotelDetail-content', { visible: true });
                  } catch (error) {}
                }
                    await page.waitForSelector('.f_searchResult-content-item', { visible: true });
                    let is_enabled = (await page.$('.f_pageBar-page--next')) !== null;
                    is_enabled = is_enabled && await page.$eval('.f_pageBar-item:last-child', (elem) => {
                    return window.getComputedStyle(elem).getPropertyValue('display') !== 'none'});
                    isBtnEnabled = is_enabled;
                    if (isBtnEnabled) {
                        await page.click('.f_pageBar-page--next');
                        await page.waitForSelector('.f_searchResult-content-item');
                        await sleep(2000)
                }  
            }
        } else {
            console.log(`Element not found on ${url}. Moving to the next link.`);
        }

});

  await cluster2.task(async ({ page, data: url }) => { 
    try {
        page.setDefaultTimeout(0);
        page.setDefaultNavigationTimeout(0);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
        const [response] = await Promise.all([
          await page.click('#pageContent > div:nth-child(3) > div > div:nth-child(2) > div.f_menu.f_menu--inline.f_menu--sticky > ul > li.f_menu-item.f_menu-item--active > span')
        ]);
        
        // await page.waitForNavigation('networkidle2' , {visible: true, timeout: 0}),
        await page.waitForSelector('.f_hotelDetail', { timeout: 0 });
        
        await page.waitForSelector('#pageContent > div:nth-child(3) > div > div:nth-child(2) > div.f_section > div.f_section-content > div:nth-child(2) > div', {  timeout: 0});
        try {
  
          isBtnEnabled = (await page.$('div.f_section-content > div:nth-child(2) > .f_termList ')) !== null;
        }
        catch (error) {
          console.log(error)
        }
        
        const hotels = [];  
        while (isBtnEnabled) {
          try {
  
            const selector = '#daktela-web > div.dw-body'; // Replace with your actual CSS selector
            const classNameToCheck = 'dw-visible'; // Replace with your actual class name
            
            // Use page.$eval to check if the element contains the specified class
            const hasClass = await page.$eval(selector, (element, className) => {
              return element.classList.contains(className);
            }, classNameToCheck);
            console.log(hasClass);
            if (hasClass) {
              await page.click('#daktela-web > div.dw-button');
            }
          
          }
          catch (error) {
            console.log(error)
          }
          await page.waitForSelector('div.f_section-content > div:nth-child(2) > div > div.relative > div.f_termList-item', { visible: true });
          await page.waitForSelector('div.f_section-content > div:nth-child(2) > div > div.relative > div.f_termList-item', { visible: true });
          const offersHandler1 = await page.$$('div.f_section-content > div:nth-child(2) > div > div.relative > div.f_termList-item')
          hotelName = "Null";
          stars = "Null";
          from = "Null";
          to = "Null";
          hotelPlace = "Null";
          try { 
            let element = await page.$('#pageContent > div:nth-child(3) > .f_hotelDetail > div.f_section');
            hotelName = await page.evaluate(element => element.querySelector('div.f_section > div:nth-child(1) > header > h1 ').textContent, element);
            stars = await page.evaluate(element => element.querySelector('div.f_section > div:nth-child(1) > header > span ').textContent, element);
            hotelName += " " ;
            let fromTo = await page.evaluate((element) => element.querySelector('div > div.f_section > div > div:nth-child(2) > div.f_column-item.f_column-item--grayBox.relative.flex.flex-col.justify-between.gap-4 > div.f_box.h-full.flex.flex-col > div.f_box-item.f_icon.f_icon--plane > div:nth-child(2) ').textContent, element);
            let array = fromTo.split(" ");
            from = array[0];
            to = array[2];
            hotelPlace = await page.evaluate(element => element.querySelector(' div.f_section-content > div > div:nth-child(1) > div > div > span.f_location > a:nth-child(5) ').textContent, element);
            var starsCount = stars.length;
          } catch (error) {
            console.log(error)
           }
          for (const offer1 of offersHandler1) {
            Price = "Null";
            img = [];
            dateFrom = "Null";
            dateTo = "Null";
            nights = "Null";
            discount = "Null" ; 
              try {
                dateFrom = await page.evaluate(offer1 => offer1.querySelector(' div.f_termList-header > div.f_termList-header-itemWrapper > div.f_termList-header-item.f_termList-header-item--dateRange > div > div:nth-child(1) > b ').textContent, offer1);
                dateTo = await page.evaluate(offer1 => offer1.querySelector(' div.f_termList-header > div.f_termList-header-itemWrapper > div.f_termList-header-item.f_termList-header-item--dateRange > div > div:nth-child(2) > b ').textContent, offer1);      
                dateFromArray = dateFrom.split(".");   
                dateFrom = dateFromArray[2].replace(" ", "").padStart(2, "0") + "-" + dateFromArray[1].replace(" ", "") + "-" + dateFromArray[0];
                dateToArray = dateTo.split(".");
                dateTo = dateToArray[2].replace(" ", "") + "-" + dateToArray[1].replace(" ", "") + "-" + dateToArray[0];
               
                if (dateFrom.includes("máj") || dateFrom.includes("jún") || dateFrom.includes("júl") || dateFrom.includes("aug") || dateFrom.includes("szept") || dateFrom.includes("okt") || dateFrom.includes("nov") || dateFrom.includes("dec")) {
                      
                  if(dateFrom.includes("máj")) {
                      dateFrom = dateFrom.replace("máj", "05")
                  }if(dateFrom.includes("jún")) {
                    dateFrom = dateFrom.replace("jún", "06")
                  } else if(dateFrom.includes("júl")) {
                    dateFrom = dateFrom.replace("júl", "07")
                  } else if (dateFrom.includes("aug")) {
                    dateFrom = dateFrom.replace("aug", "08")
                  } else if (dateFrom.includes("szept")) {
                    dateFrom = dateFrom.replace("szept", "09")
                  } else if (dateFrom.includes("okt")) {
                    dateFrom = dateFrom.replace("okt", "10")
                  } else if (dateFrom.includes("nov")) {
                    dateFrom = dateFrom.replace("nov", "11")
                  }else if (dateFrom.includes("dec")) {
                    dateFrom = dateFrom.replace("dec", "12")
                  } 
                }
                if (dateTo.includes("máj") || dateTo.includes("jún") || dateTo.includes("júl") || dateTo.includes("aug") || dateTo.includes("szept") || dateTo.includes("okt") || dateTo.includes("nov") || dateTo.includes("dec")) {
                  
                  if(dateTo.includes("máj")) {
                    dateTo = dateTo.replace("máj", "05")
                  }if(dateTo.includes("jún")) {
                    dateTo = dateTo.replace("jún", "06")
                  } else if(dateTo.includes("júl")) {
                    dateTo = dateTo.replace("júl", "07")
                  } else if (dateTo.includes("aug")) {
                    dateTo = dateTo.replace("aug", "08")
                  } else if (dateTo.includes("szept")) {
                    dateTo = dateTo.replace("szept", "09")
                  } else if (dateTo.includes("okt")) {
                    dateTo = dateTo.replace("okt", "10")
                  } else if (dateTo.includes("nov")) {
                    dateTo = dateTo.replace("nov", "11")
                  }else if (dateTo.includes("dec")) {
                    dateTo = dateTo.replace("dec", "12")
                  } 
                }
                nights = await page.evaluate(offer1 => offer1.querySelector('div.f_termList-header > div.f_termList-header-itemWrapper > div.f_termList-header-item.f_termList-header-item--nightsCount ').textContent, offer1);
                nights = nights.replace(" éjszaka", "N");
                await page.waitForSelector('div.f_termList-header > div.f_termList-header-itemWrapper > div.f_termList-header-itemWrapper > div.f_termList-header-item.f_termList-header-item--price > span.f_price.pl-1', { visible: true });
                Price = await page.evaluate(offer1 => offer1.querySelector('div.f_termList-header > div.f_termList-header-itemWrapper > div.f_termList-header-itemWrapper > div.f_termList-header-item.f_termList-header-item--price > span.f_price.pl-1').textContent, offer1);
                // #pageContent > div:nth-child(3) > div > div:nth-child(2) > div.f_section > div.f_section-content > div:nth-child(2) > div > div.relative > div:nth-child(2) > div > div.f_termList-header-itemWrapper > div.f_termList-header-itemWrapper > div.f_termList-header-item.f_termList-header-item--price > span.f_price.pl-1.min-\[1101px\]\:pl-0
                // #pageContent > div:nth-child(3) > div > div:nth-child(2) > div.f_section > div.f_section-content > div:nth-child(2) > div > div.relative > div:nth-child(1) > div > div.f_termList-header-itemWrapper > div.f_termList-header-itemWrapper > div.f_termList-header-item.f_termList-header-item--price > span.f_price.pl-1.min-\[1101px\]\:pl-0
                discount = await page.evaluate(offer1 => offer1.querySelector('div.f_termList-header > div.f_termList-header-itemWrapper > div.f_termList-header-itemWrapper > div.f_termList-header-item.f_termList-header-item--discount > span').textContent, offer1); 
                var reg = /\d+/g;
                discount = discount.match(reg) + "%";
              } catch (error) {}
            if (nights.includes("7")) {
              if ((discount == "null%") )  {
                discount = discount.replace("null", "0");
              } else if ((discount == "Null")) {
                  discount = discount.replace("Null", "0%");
              } 
              hotels.push( { hotelName, starsCount, Price, hotelPlace, from, to, dateFrom, dateTo, nights, discount });
            }
          }
          // await page.waitForSelector('#pageContent > div > div:nth-child(2) > div.f_section > div.f_section-content > div:nth-child(2) > div > div.relative > .f_termList-item', { visible: true });
          let is_enabled = (await page.$('.f_pageBar-page--next')) !== null;
          is_enabled = is_enabled && await page.$eval('.f_pageBar-item:last-child', (elem) => {
            return window.getComputedStyle(elem).getPropertyValue('display') !== 'none'});
            isBtnEnabled = is_enabled;
            if (isBtnEnabled) {
              await page.click('.f_pageBar-page--next');
              // await page.waitForSelector('#pageContent > div > div:nth-child(2) > div.f_section > div.f_section-content > div:nth-child(2) > div > div.relative > .f_termList-item');
              await sleep(2000)
            } 
        }
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0'); // January is 0, so we add 1 to get the month number
        const day = String(now.getDate()).padStart(2, '0');
        const dateWithoutHours = `${day}-${month}-${year}`;
        fs.appendFile(`result.json`, JSON.stringify(hotels , null, 2), function (err) { })
    
          appendJSONArrayToExcel(`./Kartago-${dateWithoutHours}.xlsx`, `${dateWithoutHours}-Full Season`, hotels);
       
  
        count++;
        console.log("done", count);
      } catch (error) {
        console.log("error here",error)
      }
  });
  await cluster1.queue();

})();  
