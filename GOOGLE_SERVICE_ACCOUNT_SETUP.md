# Google Service Account Setup - Step-by-Step Guide

## Quick Overview
You need to create a "service account" (a robot user) that can write to your Google Sheet automatically. This is a one-time setup that takes about 5 minutes.

---

## Step 1: Go to Google Cloud Console

1. Open: https://console.cloud.google.com
2. Sign in with your Google account (the same one that owns the Google Sheet)

---

## Step 2: Create a New Project (or Use Existing)

1. Click the project dropdown at the top (next to "Google Cloud")
2. Click **"New Project"**
3. Project name: `LinkedIn Job Scraper` (or any name you like)
4. Click **"Create"**
5. Wait a few seconds, then select your new project from the dropdown

**OR** if you already have a project, just select it from the dropdown.

---

## Step 3: Enable Google Sheets API

1. In the left sidebar, click **"APIs & Services"** → **"Library"**
2. In the search box, type: `Google Sheets API`
3. Click on **"Google Sheets API"** from the results
4. Click the blue **"Enable"** button
5. Wait for it to enable (you'll see a checkmark)

---

## Step 4: Create Service Account

1. In the left sidebar, click **"APIs & Services"** → **"Credentials"**
2. At the top, click **"+ CREATE CREDENTIALS"**
3. Select **"Service account"** from the dropdown

### Fill in Service Account Details:
- **Service account name**: `linkedin-job-scraper` (or any name)
- **Service account ID**: Will auto-fill (leave as-is)
- **Description** (optional): `Service account for LinkedIn job scraper`

4. Click **"Create and Continue"**

### Skip Role Assignment:
- On the "Grant this service account access to project" screen
- Click **"Continue"** (you don't need to assign roles)

### Skip User Access:
- On the "Grant users access to this service account" screen
- Click **"Done"** (you don't need to grant user access)

---

## Step 5: Create and Download JSON Key

1. You should now see your service account in the list
2. Click on the service account name (the email address)
3. Click the **"Keys"** tab at the top
4. Click **"Add Key"** → **"Create new key"**
5. Select **"JSON"** format
6. Click **"Create"**
7. A JSON file will automatically download to your computer

**IMPORTANT:** Save this file! You'll need it in the next step.

---

## Step 6: Find the Service Account Email

1. Open the downloaded JSON file (it's a text file)
2. Look for the `"client_email"` field
3. Copy the email address (it looks like: `linkedin-job-scraper@your-project-id.iam.gserviceaccount.com`)

**Example:**
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "...",
  "client_email": "linkedin-job-scraper@your-project-id.iam.gserviceaccount.com",
  ...
}
```

Copy the `client_email` value - you'll need it in Step 7.

---

## Step 7: Share Your Google Sheet with Service Account

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1TUv8SLXksmgpYuX5m9rrMGarFR3g9lKA0x-b1PeNTPQ/edit
2. Click the blue **"Share"** button (top right)
3. In the "Add people and groups" box, paste the service account email (from Step 6)
4. Make sure the permission is set to **"Editor"** (not Viewer)
5. **UNCHECK** "Notify people" (you don't need to notify a robot)
6. Click **"Share"**

---

## Step 8: Upload JSON File to Server

1. The JSON file you downloaded is on your computer
2. Upload it to your server at: `/root/linkedin-job-scraper/credentials/google-sheets-credentials.json`

**Using SCP (from your local machine):**
```bash
scp /path/to/downloaded/file.json root@72.62.134.99:/root/linkedin-job-scraper/credentials/google-sheets-credentials.json
```

**Or manually:**
- Copy the entire contents of the JSON file
- SSH into your server
- Create the file: `nano /root/linkedin-job-scraper/credentials/google-sheets-credentials.json`
- Paste the JSON content
- Save (Ctrl+X, then Y, then Enter)

---

## Step 9: Verify Setup

Check that the file exists:
```bash
ls -la /root/linkedin-job-scraper/credentials/google-sheets-credentials.json
```

You should see the file listed. If it's there, you're ready to test!

---

## Troubleshooting

### "Permission denied" error
- Make sure you shared the Google Sheet with the service account email
- Make sure you gave it "Editor" permissions (not Viewer)

### "Credentials not found" error
- Check the file path: `/root/linkedin-job-scraper/credentials/google-sheets-credentials.json`
- Make sure the JSON file is valid (open it and check it's proper JSON)

### "API not enabled" error
- Go back to Step 3 and make sure Google Sheets API is enabled

---

## Quick Checklist

- [ ] Created Google Cloud project
- [ ] Enabled Google Sheets API
- [ ] Created service account
- [ ] Downloaded JSON key file
- [ ] Copied service account email
- [ ] Shared Google Sheet with service account email (Editor permission)
- [ ] Uploaded JSON file to server at correct path

---

## Next Steps

Once all steps are complete, you can test with:
```bash
cd /root/linkedin-job-scraper
cp config.example.json config.json
# Edit config.json and add your Apify token
node src/scraper.js
```

---

## Need Help?

If you get stuck at any step, let me know which step number and what error you're seeing!
