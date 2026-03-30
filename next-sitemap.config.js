/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://hobbypulse.vercel.app",
  generateRobotsTxt: true,
};
