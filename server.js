const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Function to extract emails from text using regex
function extractEmails(text) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return text.match(emailRegex) || [];
}

// Function to scrape website for emails
async function scrapeWebsiteForEmails(url) {
    try {
        const response = await axios.get(url, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(response.data);
        const text = $('body').text();
        return extractEmails(text);
    } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        return [];
    }
}

// Function to search Google for business websites
async function searchBusinessWebsites(keywords, state, city) {
    const query = `${keywords} ${city} ${state} site`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    
    try {
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        const websites = [];
        
        $('div.yuRUbf a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.startsWith('http') && !href.includes('google.com')) {
                websites.push(href);
            }
        });
        
        return websites.slice(0, 10); // Limit to first 10 results
    } catch (error) {
        console.error('Google search error:', error);
        return [];
    }
}

app.post('/scrape', async (req, res) => {
    const { keywords, state, city } = req.body;

    try {
        const businessWebsites = await searchBusinessWebsites(keywords, state, city);
        let allEmails = [];

        for (const url of businessWebsites) {
            try {
                const emails = await scrapeWebsiteForEmails(url);
                allEmails = allEmails.concat(emails);
            } catch (error) {
                console.error(`Error processing ${url}:`, error);
            }
        }

        // Remove duplicates and limit to 5000 emails
        const uniqueEmails = [...new Set(allEmails)].slice(0, 5000);

        res.json({ emails: uniqueEmails });
    } catch (error) {
        console.error('Scraping error:', error);
        res.status(500).json({ 
            error: 'Failed to scrape data', 
            details: error.message 
        });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
