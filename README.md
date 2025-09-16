This project is a Compliance Portal built with Next.js. It provides functionalities for managing audit trails, user authentication, department management, document handling, return definitions, scheduling, submission tracking, and user management.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.


## Deploy on CentOS Server

To deploy this Next.js application on a CentOS server, follow these steps:

### 1. Application Deployment

a. **Navigate to the application directory:**
```bash
scp -r ./src/ <username>@<server-address>:/var/www/compliance.nbs.co.zw
cd /var/www/compliance.nbs.co.zw
```

b. **Navigate to the server:**
```bash
cd /var/www/compliance.nbs.co.zw
```

c. **Build the Next.js application:**
   Before building, ensure to remove any previous build artifacts:
```bash
rm -rf .next
npm run build
```

d. **Start the application in production mode:**
   You can use a process manager like PM2 to keep your application running:

   **Start your application with PM2:**
```bash
pm2 restart npm --name "compliance-app"
```

Your Next.js Compliance Portal should now be accessible via http://192.168.1.145:3000/

## Version Control and Branching Strategy

This project's source code is hosted on GitHub: https://github.com/National-Building-Society/compliance-portal

**Branching Strategy:**
- The `main` branch is used for production deployments.
- The `develop` branch is used for active development and new changes.

