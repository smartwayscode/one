// Final working code for the project
const path = require('path');
const fs = require('fs');
const { Cluster } = require('puppeteer-cluster');
const { appendJSONArrayToExcel } = require('./excel');  
const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}; 

(async () => {

  let periodText = "May-June 2024";
  let count = 0;

  const pathToExtension1 = path.join(process.cwd(), 'cookie-blocker');
  const cluster1 = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 100, 
    timeout: 1200000,
    sameDomainDelay: 20000000,
    workerCreationDelay: 20000000 , 
    // monitor: true,
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
    maxConcurrency: 2,
    timeout: 1200000,
    sameDomainDelay: 3000,
    monitor: true,
    workerCreationDelay: 3000,
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
    
  
  await cluster1.task(async ({ page, data: period }) => {
    try {    
      page.setDefaultNavigationTimeout(0);
      page.setDefaultTimeout(0);
      await page.goto("https://www.kartagotours.hu/", { waitUntil: 'networkidle2' });
      // may/june or july/august or august/september
      await page.click('.f_filterMainSearch-content > .f_filterMainSearch-content-item > .f_button');
      await page.click('.f_customScroll > .f_column > .f_column-item:last-child > .f_list > .f_list-item:last-child > .f_input-wrapper > .flex > .relative');
      await page.click('div.f_filterMainSearch-content > .f_filterMainSearch-content-item:nth-child(3) > .f_button');
      sleep(2000)
      try {
        if (period == "1") {
         await page.click('div.f_filterHolder.js_filterHolder.f_set--active > div.f_filterHolder-content > div > div:nth-child(2) > div.f_paragraph.f_show--from900 > div:nth-child(2) > span')
         const n = await page.$("div.f_filterHolder.js_filterHolder.f_set--active > div.f_filterHolder-content > div > div:nth-child(2) > div.f_paragraph.f_show--from900 > div:nth-child(2) > span > label > span > span ")
         periodText = await page.evaluate(el => el.textContent, n);  
        } else if (period == "2") {
        await page.click('div.f_filterHolder.js_filterHolder.f_set--active > div.f_filterHolder-content > div > div:nth-child(2) > div.f_paragraph.f_show--from900 > div:nth-child(3) > span')
        const n = await page.$("div.f_filterHolder.js_filterHolder.f_set--active > div.f_filterHolder-content > div > div:nth-child(2) > div.f_paragraph.f_show--from900 > div:nth-child(3) > span > label > span > span ")
        // periodText = await page.evaluate(el => el.textContent, n);  
        // div.f_filterHolder.js_filterHolder.f_set--active > div.f_filterHolder-content > div > div:nth-child(2) > div.f_paragraph.f_show--from900 > div:nth-child(3) > span  
      } 
      }catch (error) {
        console.log(error)
      }
      sleep(2000)
      await page.waitForSelector('.f_filterHolder.js_filterHolder.f_set--active > div.f_filterHolder-footer.js_filter-footer > div:nth-child(3) > a', { visible: true });
      await page.click('div.f_filterHolder.js_filterHolder.f_set--active > div.f_filterHolder-footer.js_filter-footer > div:nth-child(3) > a')
     
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
      // fs.appendFile('resulturls1.json', JSON.stringify(hotelsurls, null, 2), function (err) { })
      }catch (error) {
        console.log(error)
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
        await page.waitForSelector('div.f_section-content > div:nth-child(2) > div > div.relative > div.f_termList-item', { visible: true });
        await page.waitForSelector('div.f_section-content > div:nth-child(2) > div > div.relative > div.f_termList-item', { visible: true });
        offersHandler1 = await page.$$('div.f_section-content > div:nth-child(2) > div > div.relative > div.f_termList-item')
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
          var Price = "Null";
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
              dateTo = dateToArray[2].replace(" ", "").padStart(2, "0") + "-" + dateToArray[1].replace(" ", "") + "-" + dateToArray[0];
             
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
              discount = await page.evaluate(offer1 => offer1.querySelector('div.f_termList-header > div.f_termList-header-itemWrapper > div.f_termList-header-itemWrapper > div.f_termList-header-item.f_termList-header-item--discount > span').textContent, offer1); 
              var reg = /\d+/g;
              discount = discount.match(reg) + "%";
            } catch (error) {}
          if (nights.includes("7")) {
            if ((discount == "null%") )  {
              discount = discount.replace("null", "0");
            } else if ((discount == "Null")) {
                discount = discount.replace("Null", "0%");
            } else if (Price == "Null") {
              // const p = await page.$("div.f_filterHolder.js_filterHolder.f_set--active > div.f_filterHolder-content > div > div:nth-child(2) > div.f_paragraph.f_show--from900 > div:nth-child(2) > span > label > span > span ")
              // ftPrice = await page.evaluate(el => el.textContent, p); 
              // ftprice     
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
  
        appendJSONArrayToExcel(`./Kartago-${dateWithoutHours}.xlsx`, periodText, hotels);
     
      
      count++;
      console.log("done", count);
    } catch (error) {
      console.log("error here",error)
    }

  });

  await cluster1.queue("2");
  // await cluster1.waitForOne()
  // await cluster1.idle()
  // await cluster1.close()


// cluster2.queue("https://www.kartagotours.hu/tunezia/tunezia-(szarazfold)/sousse/royal-jinene-resort?D=63252|63447&DD=2024-05-10&DP=489&DPR=KARTAGO-HU-ATCOM&DS=65536&GIATA=4109&HID=141523&IFM=0&ILM=0&MNN=7&MT=5&NN=7&PID=MIR90007&RC=DR01&RD=2024-05-18&TO=489|4371&df=2024-05-01|2024-06-30&nnm=7|8|9|10|11|12|13|14&ptm=0&tom=489|4371&tt=1&ttm=1#/terminy-a-ceny")

})();
