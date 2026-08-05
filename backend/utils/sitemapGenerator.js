const fs = require('fs');
const path = require('path');
const Course = require('../models/Course');

const generateSitemapXML = async () => {
  // Query all published courses from MongoDB
  const courses = await Course.find({ status: 'published' }).select('slug updatedAt');

  const siteUrl = process.env.SITEMAP_SITE_URL || 'https://www.stuvaradhi.in';

  // Base static URLs
  const staticUrls = [
    { loc: `${siteUrl}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${siteUrl}/courses`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${siteUrl}/about`, priority: '0.8', changefreq: 'monthly' },
    { loc: `${siteUrl}/contact`, priority: '0.7', changefreq: 'monthly' },
    { loc: `${siteUrl}/login`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${siteUrl}/register`, priority: '0.5', changefreq: 'monthly' },
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Static URLs
  staticUrls.forEach((url) => {
    xml += `  <url>\n`;
    xml += `    <loc>${url.loc}</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  // Dynamic Course URLs
  courses.forEach((course) => {
    const lastModDate = course.updatedAt ? new Date(course.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    xml += `  <url>\n`;
    xml += `    <loc>${siteUrl}/course/${course.slug}</loc>\n`;
    xml += `    <lastmod>${lastModDate}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += '</urlset>\n';
  return xml;
};

const writeSitemapToFile = async (xml) => {
  const targets = [
    // Frontend public folder
    path.join(__dirname, '..', '..', 'frontend', 'public', 'sitemap.xml'),
    // Frontend dist folder
    path.join(__dirname, '..', '..', 'frontend', 'dist', 'sitemap.xml'),
    // Local uploads directory as fallback
    path.join(__dirname, '..', 'uploads', 'sitemap.xml')
  ];

  for (const targetPath of targets) {
    try {
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(targetPath, xml, 'utf8');
      console.log(`Sitemap written successfully to: ${targetPath}`);
    } catch (err) {
      console.warn(`Failed to write sitemap to ${targetPath}: ${err.message}`);
    }
  }
};

module.exports = {
  generateSitemapXML,
  writeSitemapToFile
};
