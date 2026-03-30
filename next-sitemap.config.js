/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl:
    process.env.SITE_URL ||
    (process.env.NEXT_PUBLIC_SITE_VERTICAL === "simracing"
      ? "https://simpitstop.com"
      : "https://warhammerwatch.com"),
  generateRobotsTxt: true,
};
