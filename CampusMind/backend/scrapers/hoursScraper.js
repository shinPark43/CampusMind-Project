import puppeteer from 'puppeteer';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';
import { connectRAGDB, Hours, hoursSchema } from '../db/ragDb.js';
import dotenv from 'dotenv';
import { config } from 'dotenv';

// Load environment variables
const envPath = path.join(dirname(fileURLToPath(import.meta.url)), '../.env');
config({ path: envPath });

// Verify environment variables
if (!process.env.MONGODB_RAG_URI) {
  console.error('MONGODB_RAG_URI is not defined in .env file');
  console.log('Current .env path:', envPath);
  process.exit(1);
}

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class HoursScraper {
  constructor() {
    this.url = 'https://www.angelo.edu/life-on-campus/play/university-recreation/urec-hours-of-operation.php';
    this.outputDir = path.join(__dirname, '../data/hours');
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
    this.navigationTimeout = 120000; // 2 minutes
  }

  async initialize() {
    // Ensure output directory exists
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('Error creating output directory:', error);
    }
  }

  async scrapeWeekData(page) {
    return await page.evaluate(() => {
      console.log('Starting to scrape week data...');
      
      // Get the table data
      const table = document.querySelector('table');
      if (!table) {
        throw new Error('Hours table not found on page');
      }

      // Get all rows
      const rows = Array.from(table.querySelectorAll('tr'));
      if (rows.length === 0) {
        throw new Error('No rows found in hours table');
      }

      // Get header cells to extract dates
      const headerCells = Array.from(rows[0].querySelectorAll('th'));
      const daysWithDates = headerCells
        .map(cell => cell.textContent.trim())
        .filter(text => text.length > 0);

      console.log('Days with dates:', daysWithDates);

      // Extract first and last dates for the date range
      const firstDateMatch = daysWithDates[0]?.match(/(\d{1,2})\/(\d{1,2})/);
      const lastDateMatch = daysWithDates[daysWithDates.length - 1]?.match(/(\d{1,2})\/(\d{1,2})/);
      
      // Construct date range
      let dateRange = null;
      if (firstDateMatch && lastDateMatch) {
        const [_, firstMonth, firstDay] = firstDateMatch;
        const [__, lastMonth, lastDay] = lastDateMatch;
        
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        
        if (firstMonth === lastMonth) {
          dateRange = `${months[parseInt(firstMonth) - 1]} ${firstDay}-${lastDay}, 2025`;
        } else {
          dateRange = `${months[parseInt(firstMonth) - 1]} ${firstDay} - ${months[parseInt(lastMonth) - 1]} ${lastDay}, 2025`;
        }
      }

      console.log('Date range:', dateRange);

      // Base days array for reference
      const baseDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      // Function to format the day with date
      const formatDayWithDate = (baseDay, dateText) => {
        const dateMatch = dateText.match(/\d{1,2}\/\d{1,2}/);
        return dateMatch ? `${baseDay} ${dateMatch[0]}` : baseDay;
      };

      // Create days array with dates
      const days = baseDays.map((day, index) => {
        const headerText = daysWithDates[index] || '';
        return formatDayWithDate(day, headerText);
      });

      console.log('Formatted days:', days);

      // Process facility rows
      const facilityData = [];
      const facilityRows = rows.slice(1); // Skip header row

      // Function to extract just the time from a cell
      const extractTime = (text) => {
        return text.replace(/[A-Za-z]+\s+\d{1,2}\/\d{1,2}:\s*/, '').trim();
      };

      // Known facility names in order
      const facilityNames = ['CHP', 'Swimming Pool', 'Climbing Gym', 'Lake House', 'Intramural Complex'];

      facilityRows.forEach((row, index) => {
        const cells = Array.from(row.querySelectorAll('td'));
        
        if (cells.length > 0 && index < facilityNames.length) {
          const schedule = {};

          days.forEach((day, i) => {
            if (cells[i]) {
              const rawHours = cells[i].textContent;
              schedule[day] = extractTime(rawHours);
            } else {
              schedule[day] = 'closed';
            }
          });

          console.log(`Facility ${facilityNames[index]} schedule:`, schedule);

          facilityData.push({
            name: facilityNames[index],
            schedule: schedule
          });
        }
      });

      const result = {
        dateRange,
        facilities: facilityData
      };

      console.log('Final scraped data:', JSON.stringify(result, null, 2));
      return result;
    });
  }

  async navigateToPage(page) {
    let retries = this.maxRetries;
    while (retries > 0) {
      try {
        console.log(`Attempting to navigate to page (${this.maxRetries - retries + 1}/${this.maxRetries})...`);
        
        // Add more detailed logging
        console.log('Current URL:', this.url);
        console.log('Browser user agent:', await page.evaluate(() => navigator.userAgent));
        
        // Try with different wait conditions
        try {
          await page.goto(this.url, {
            waitUntil: 'domcontentloaded',
            timeout: this.navigationTimeout
          });
        } catch (error) {
          console.log('domcontentloaded failed, trying networkidle0...');
          await page.goto(this.url, {
            waitUntil: 'networkidle0',
            timeout: this.navigationTimeout
          });
        }
        
        // Verify we're on the right page
        const currentUrl = await page.url();
        console.log('Successfully navigated to:', currentUrl);
        
        // Wait for the table to be present
        await page.waitForSelector('table', { timeout: 30000 });
        console.log('Table found on page');
        
        return true;
      } catch (error) {
        console.log(`Navigation attempt failed: ${error.message}`);
        console.log('Error stack:', error.stack);
        
        retries--;
        if (retries === 0) {
          throw error;
        }
        console.log(`Retrying in ${this.retryDelay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  async scrapeAllWeeks() {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--window-size=1920,1080',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--proxy-server="direct://"',
        '--proxy-bypass-list=*'
      ]
    });

    const page = await browser.newPage();
    
    // Set up anti-bot detection measures
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Enable request interception
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      // Block unnecessary resources
      if (['image', 'stylesheet', 'font', 'media'].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    // Set longer timeouts
    page.setDefaultNavigationTimeout(this.navigationTimeout);
    page.setDefaultTimeout(this.navigationTimeout);
    
    // Add random delays between actions
    const randomDelay = () => new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
    
    try {
      // Navigate to page with retry logic
      await this.navigateToPage(page);
      await randomDelay();
      
      const allWeeksData = [];
      
      // Scrape current week
      console.log('\nScraping current week...');
      let currentWeekData = await this.scrapeWeekData(page);
      console.log('Current week data:', JSON.stringify(currentWeekData, null, 2));
      
      // Save current week data
      console.log('\nSaving current week data...');
      for (const facility of currentWeekData.facilities) {
        for (const [day, hours] of Object.entries(facility.schedule)) {
          try {
            await this.saveHoursToDatabase(
              facility.name,
              currentWeekData.dateRange,
              day,
              hours
            );
          } catch (error) {
            console.error(`Error saving data for ${facility.name} on ${day}:`, error);
          }
        }
      }
      
      allWeeksData.push(currentWeekData);
      
      // Keep clicking next week until we can't anymore
      while (true) {
        try {
          // Check if next week button exists and is not disabled
          const nextButtonExists = await page.evaluate(() => {
            const button = document.querySelector('button.nextWeek');
            return button && !button.disabled;
          });
          
          if (!nextButtonExists) {
            console.log('No more weeks available');
            break;
          }
          
          // Click next week button with retry logic
          let clicked = false;
          for (let i = 0; i < this.maxRetries; i++) {
            try {
              await page.click('button.nextWeek');
              await randomDelay();
              clicked = true;
              break;
            } catch (error) {
              console.log(`Click attempt ${i + 1} failed, retrying...`);
              await randomDelay();
            }
          }
          
          if (!clicked) {
            console.log('Failed to click next week button after retries');
            break;
          }
          
          // Wait for the table to update
          await page.waitForSelector('table', { timeout: 30000 });
          await randomDelay();
          
          // Scrape the new week's data
          currentWeekData = await this.scrapeWeekData(page);
          console.log('Next week data:', JSON.stringify(currentWeekData, null, 2));
          
          // Save to database
          for (const facility of currentWeekData.facilities) {
            for (const [day, hours] of Object.entries(facility.schedule)) {
              try {
                await this.saveHoursToDatabase(
                  facility.name,
                  currentWeekData.dateRange,
                  day,
                  hours
                );
              } catch (error) {
                console.error(`Error saving data for ${facility.name} on ${day}:`, error);
              }
            }
          }
          
          allWeeksData.push(currentWeekData);
          
        } catch (error) {
          console.error('Error scraping next week:', error);
          break;
        }
      }
      
      return allWeeksData;
      
    } catch (error) {
      console.error('Error in scrapeAllWeeks:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }

  async saveHoursToDatabase(location, dateRange, day, hours) {
    try {
      console.log(`\nAttempting to save hours data:`);
      console.log(`Location: ${location}`);
      console.log(`Date Range: ${dateRange}`);
      console.log(`Day: ${day}`);
      console.log(`Hours: ${hours}`);

      // Validate input data
      if (!location || !dateRange || !day || hours === undefined) {
        throw new Error(`Invalid data: location=${location}, dateRange=${dateRange}, day=${day}, hours=${hours}`);
      }

      // Ensure we have a valid connection
      const conn = await connectRAGDB();
      if (!conn) {
        throw new Error('Failed to establish database connection');
      }

      // Get the Hours model from the connection
      const HoursModel = conn.model('Hours', hoursSchema);

      // Check if data exists for this location, date, and day
      const existingData = await HoursModel.findOne({
        location,
        date: dateRange,
        day
      });

      if (existingData) {
        // Always update the existing data to ensure fresh timestamps
        console.log(`Updating existing data for ${location} on ${day} (${dateRange})`);
        existingData.hours = hours;
        existingData.timestamp = new Date();
        await existingData.save();
        console.log(`Successfully updated hours data for ${location} on ${day} (${dateRange}): ${hours}`);
        return;
      }

      // Create and save new hours data
      const hoursData = new HoursModel({
        location,
        date: dateRange,
        day,
        hours,
        timestamp: new Date()
      });

      await hoursData.save();
      console.log(`Successfully saved new hours data for ${location} on ${day} (${dateRange}): ${hours}`);
    } catch (error) {
      console.error('Error saving hours data to database:', error);
      console.error('Error details:', {
        location,
        dateRange,
        day,
        hours,
        errorMessage: error.message,
        errorStack: error.stack
      });
      throw error; // Re-throw to be caught by the caller
    }
  }
}

// Execute if run directly
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const scraper = new HoursScraper();
  scraper.scrapeAllWeeks()
    .then(data => {
      console.log('\nSuccessfully scraped all weeks of hours data');
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to scrape hours:', error);
      process.exit(1);
    });
}

export default HoursScraper; 