const puppeteer = require('puppeteer')
const Xvfb = require('xvfb');
const path = require('path');
const fs = require('fs');
const { Cluster } = require('puppeteer-cluster');
const { appendJSONArrayToExcel } = require('./excel');
(async () => {
      var xvfb1 = new Xvfb({
    silent: true,
    xvfb_args: ["-screen", "0", "1280x720x24", "-ac"],
  });
  xvfb1.start((err) => {
    if (err) console.error(err);
  });

  var xvfb2 = new Xvfb({
    silent: true,
    xvfb_args: ["-screen", "0", "1280x720x24", "-ac"],
  });
  xvfb2.start((err) => {
    if (err) console.error(err);
  });

  const pathToExtension1 = path.join(process.cwd(), 'cookie-blocker');
  const cluster1 = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 100,
    timeout: 1200000,
    sameDomainDelay: 20000000,
    workerCreationDelay: 20000000 ,
    puppeteerOptions: {
      protocolTimeout: 1200000,
      headless: false,
      args: [
        '--no-sandbox',
        '--start-maximized', '--display='+xvfb1._display,
        `--disable-extensions-except=${pathToExtension1}`,
        `--load-extension=${pathToExtension1}`,
            '--enable-automation'
        ]
      },
  });
  const cluster2 = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 100,
    timeout: 1200000,
    sameDomainDelay: 20000,
    monitor: true,
    workerCreationDelay: 20000,
    puppeteerOptions: {
      protocolTimeout: 1200000,
      headless: false,
      args: [
        '--no-sandbox', '--disable-setuid-sandbox',  '--no-sandbox',
        '--disable-gpu',
                '--start-maximized', '--display='+xvfb1._display,
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

    await cluster1.task(async ({ page }) => {
    try {
      page.setDefaultNavigationTimeout(0);
      page.setDefaultTimeout(0);
      await page.goto("https://www.kartagotours.hu/keresesi-eredmenyek?d=63252|63447&dd=2024-07-01&nn=7|8|9|10|11|12|13|14&rd=2024-08-31&to=489|4371&tt=1", { waitUntil: 'networkidle2' });
      await page.waitForSelector('.f_searchResult-content',  { visible: true });
      const hotelsurls = []
      let isBtnEnabled = (await page.$('.f_searchResult-content-item')) !== null;
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
                // cluster2.close()
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
      



console.log(Price)
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
await cluster1.queue();
})()
