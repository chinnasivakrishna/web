const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const submitSitemapToGoogle = async () => {
  const siteUrl = process.env.GSC_PROPERTY_URL || 'https://www.stuvaradhi.in/';
  const feedpath = process.env.GSC_SITEMAP_URL || 'https://www.stuvaradhi.in/sitemap.xml';

  try {
    let authConfig = {
      scopes: ['https://www.googleapis.com/auth/webmasters'],
    };

    // If environment variable contains the JSON string, parse and use it directly
    if (process.env.GOOGLE_CREDS_JSON) {
      console.log('[GSC-Sitemap] Authenticating using GOOGLE_CREDS_JSON environment variable...');
      authConfig.credentials = JSON.parse(process.env.GOOGLE_CREDS_JSON);
    } else {
      // Fallback to reading the local service-account JSON file (e.g. during development)
      const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS || 'config/google-service-account.json';
      const keyPath = path.isAbsolute(keyFilename) 
        ? keyFilename 
        : path.join(__dirname, '..', keyFilename);

      if (!fs.existsSync(keyPath)) {
        console.warn(`[GSC-Sitemap] Warning: Google service account credentials file not found at ${keyPath} and GOOGLE_CREDS_JSON environment variable is missing. Submission skipped.`);
        return { success: false, message: 'Credentials not found.' };
      }
      
      authConfig.keyFile = keyPath;
    }

    const auth = new google.auth.GoogleAuth(authConfig);

    const authClient = await auth.getClient();
    const searchconsole = google.searchconsole({
      version: 'v1',
      auth: authClient,
    });

    console.log(`[GSC-Sitemap] Attempting to submit sitemap for ${siteUrl} (feed: ${feedpath})...`);
    
    const response = await searchconsole.sitemaps.submit({
      siteUrl: siteUrl,
      feedpath: feedpath,
    });

    console.log(`[GSC-Sitemap] Google Search Console submission response status: ${response.status}`);
    return { success: true, status: response.status };
  } catch (error) {
    console.error(`[GSC-Sitemap] Error submitting sitemap to Google Search Console:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  submitSitemapToGoogle,
};
