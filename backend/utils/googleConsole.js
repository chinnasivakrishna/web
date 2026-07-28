const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const submitSitemapToGoogle = async () => {
  const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS || 'config/google-service-account.json';
  const keyPath = path.isAbsolute(keyFilename) 
    ? keyFilename 
    : path.join(__dirname, '..', keyFilename);

  // If the service account file does not exist, log a warning and return early
  if (!fs.existsSync(keyPath)) {
    console.warn(`[GSC-Sitemap] Warning: Google service account credentials file not found at ${keyPath}. Google Search Console submission skipped.`);
    return { success: false, message: 'Credentials file not found.' };
  }

  const siteUrl = process.env.GSC_PROPERTY_URL || 'https://www.stuvaradhi.in/';
  const feedpath = process.env.GSC_SITEMAP_URL || 'https://www.stuvaradhi.in/sitemap.xml';

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: keyPath,
      scopes: ['https://www.googleapis.com/auth/webmasters'],
    });

    const authClient = await auth.getClient();
    const searchconsole = google.searchconsole({
      version: 'v3',
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
