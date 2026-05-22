SiteVerdict2 GitHub source fix

Use this ZIP for GitHub repo teamarmplus/Site only.

What this package fixes:
- All visible Full Report links point to /full-report.html.
- public/_redirects still keeps /full-report -> /full-report.html as backup.
- Services response wording says within 24 hours for quote-ready enquiries.
- Netlify config keeps publish=public and functions=public/netlify/functions.

Commit message:
Fix full report links and services response wording

After GitHub commit and Netlify siteverdict2 deploy, test:
- https://siteverdict2.netlify.app/
- https://siteverdict2.netlify.app/full-report.html
- https://siteverdict2.netlify.app/hot-list
- https://siteverdict2.netlify.app/services
