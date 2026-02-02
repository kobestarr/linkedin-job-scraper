# GitHub Repository Setup

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: **linkedin-job-scraper**
3. Description: "Automated LinkedIn job scraping system that pushes to Google Sheets"
4. Choose **Public** or **Private** (your preference)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 2: Add Remote and Push

Once you've created the repository, run these commands on the server:

```bash
cd /root/linkedin-job-scraper
git remote add origin https://github.com/YOUR_USERNAME/linkedin-job-scraper.git
git branch -M main
git push -u origin main
```

**Replace YOUR_USERNAME with your GitHub username.**

## Alternative: Using SSH (if you have SSH keys set up)

```bash
cd /root/linkedin-job-scraper
git remote add origin git@github.com:YOUR_USERNAME/linkedin-job-scraper.git
git branch -M main
git push -u origin main
```

## Verify

After pushing, verify at: https://github.com/YOUR_USERNAME/linkedin-job-scraper
