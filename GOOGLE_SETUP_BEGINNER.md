# Google Service Account Setup - EXACT Steps (No Experience Needed)

Follow these steps EXACTLY. Copy and paste exactly what I tell you.

---

## STEP 1: Open Google Cloud Console

1. Open your web browser (Chrome, Firefox, Safari, etc.)
2. Go to this EXACT link: **https://console.cloud.google.com**
3. Sign in with your Google account (the same Google account that owns your Google Sheet)

---

## STEP 2: Create a New Project

**What you'll see:** A page with "Google Cloud" at the top and a dropdown that says "Select a project"

**What to do:**
1. Look at the TOP of the page, find the dropdown that says **"Select a project"** (it's near the top, usually blue or gray)
2. Click on that dropdown
3. Click the button that says **"+ NEW PROJECT"** (it's usually at the top of the dropdown menu)

**Fill in the form:**
- **Project name:** Type exactly this: `LinkedIn Job Scraper`
- **Location:** Leave this as "No organization" (don't change it)
- Click the blue **"CREATE"** button at the bottom

**Wait:** It will say "Creating project..." - wait 10-20 seconds until it says "Project created"

**Then:**
1. Click the project dropdown again (at the top)
2. Click on **"LinkedIn Job Scraper"** to select it

---

## STEP 3: Enable Google Sheets API

**What you'll see:** The Google Cloud Console dashboard

**What to do:**
1. Look at the LEFT SIDEBAR (the menu on the left side)
2. Find and click **"APIs & Services"** (it has an icon that looks like a puzzle piece or API symbol)
3. A submenu will appear - click **"Library"** (it's usually the first option)

**Search for the API:**
1. You'll see a search box at the top that says "Search for APIs & Services"
2. Click in that search box
3. Type exactly this: `Google Sheets API`
4. Press Enter or click the search icon

**Enable it:**
1. You'll see a result called **"Google Sheets API"** - click on it
2. You'll see a page with information about Google Sheets API
3. Click the big blue **"ENABLE"** button (it's usually at the top)
4. Wait 10-20 seconds - you'll see a checkmark and "API enabled"

---

## STEP 4: Create Service Account

**Go back to Credentials:**
1. Look at the LEFT SIDEBAR again
2. Click **"APIs & Services"**
3. Click **"Credentials"** (it's usually the second option in the submenu)

**Create the service account:**
1. At the TOP of the page, you'll see a button that says **"+ CREATE CREDENTIALS"** - click it
2. A dropdown menu will appear
3. Click on **"Service account"** (it's usually near the top of the dropdown)

**Fill in the form (EXACTLY as shown):**

**Service account details:**
- **Service account name:** Type exactly: `linkedin-job-scraper`
- **Service account ID:** Leave this alone (it will auto-fill)
- **Description (optional):** Type exactly: `Service account for LinkedIn job scraper`

4. Click the blue **"CREATE AND CONTINUE"** button at the bottom

**Skip the next screen:**
1. You'll see a screen that says "Grant this service account access to project"
2. **DON'T ADD ANYTHING** - just click the blue **"CONTINUE"** button at the bottom

**Skip the next screen:**
1. You'll see a screen that says "Grant users access to this service account"
2. **DON'T ADD ANYTHING** - just click the blue **"DONE"** button at the bottom

---

## STEP 5: Download the JSON Key File

**What you'll see:** A list of service accounts (you should see "linkedin-job-scraper")

**What to do:**
1. Find the service account that says **"linkedin-job-scraper"** in the list
2. Click on the **EMAIL ADDRESS** (it looks like: `linkedin-job-scraper@something.iam.gserviceaccount.com`)
3. This will open the service account details page

**Create the key:**
1. At the TOP of the page, you'll see tabs - click the **"KEYS"** tab
2. Click the **"+ ADD KEY"** button
3. Click **"Create new key"** from the dropdown
4. A popup will appear - make sure **"JSON"** is selected (it should be by default)
5. Click the blue **"CREATE"** button

**Download happens automatically:**
- A file will download to your computer (usually goes to your Downloads folder)
- The filename will be something like: `your-project-id-abc123.json`
- **SAVE THIS FILE** - you'll need it in a minute!

---

## STEP 6: Find the Service Account Email

**What to do:**
1. Open the JSON file you just downloaded (double-click it - it will open in a text editor)
2. Look for a line that says `"client_email":`
3. Copy the email address that comes after it (it's in quotes)

**Example of what you're looking for:**
```json
"client_email": "linkedin-job-scraper@your-project-123456.iam.gserviceaccount.com"
```

**Copy the ENTIRE email address** (including the part after the @ sign)

**Example email format:**
- `linkedin-job-scraper@linkedin-job-scraper-123456.iam.gserviceaccount.com`

**Keep this email copied** - you'll paste it in the next step!

---

## STEP 7: Share Your Google Sheet

**Open your Google Sheet:**
1. Go to this EXACT link: **https://docs.google.com/spreadsheets/d/1TUv8SLXksmgpYuX5m9rrMGarFR3g9lKA0x-b1PeNTPQ/edit**
2. Your Google Sheet will open

**Share it:**
1. Look at the TOP RIGHT corner of the page
2. Find the big blue button that says **"Share"** - click it
3. A popup window will appear

**Add the service account:**
1. In the popup, you'll see a box that says "Add people and groups"
2. Click in that box
3. **PASTE the email address** you copied in Step 6 (the service account email)
4. Next to the email, you'll see a dropdown that says "Viewer" - click it
5. Change it to **"Editor"** (click on "Editor" from the dropdown)
6. **IMPORTANT:** Uncheck the box that says "Notify people" (you don't need to notify a robot)
7. Click the blue **"Share"** button at the bottom

**Done!** The popup will close. Your sheet is now shared with the service account.

---

## STEP 8: Upload JSON File to Server

**You have two options - choose the easier one:**

### Option A: Using SCP (if you have terminal/command line)

1. Open Terminal (Mac) or Command Prompt (Windows) or PowerShell
2. Find where your JSON file downloaded (usually Downloads folder)
3. Run this command (replace `/path/to/file.json` with the actual path to your file):

```bash
scp /path/to/file.json root@72.62.134.99:/root/linkedin-job-scraper/credentials/google-sheets-credentials.json
```

**Example if file is in Downloads:**
- Mac/Linux: `scp ~/Downloads/your-project-id-abc123.json root@72.62.134.99:/root/linkedin-job-scraper/credentials/google-sheets-credentials.json`
- Windows: Use the full path like `scp C:\Users\YourName\Downloads\your-project-id-abc123.json root@72.62.134.99:/root/linkedin-job-scraper/credentials/google-sheets-credentials.json`

### Option B: Manual Copy/Paste (EASIER)

1. **Open the JSON file** you downloaded (double-click it)
2. **Select ALL the text** (Ctrl+A on Windows, Cmd+A on Mac)
3. **Copy it** (Ctrl+C on Windows, Cmd+C on Mac)

**Then SSH into your server:**
1. Open Terminal/Command Prompt
2. Run: `ssh root@72.62.134.99`
3. Enter password when prompted: `BSttB0N5&rPEZ3en`

**Create the file:**
1. Run this command: `nano /root/linkedin-job-scraper/credentials/google-sheets-credentials.json`
2. **Paste the JSON content** (right-click and paste, or Ctrl+V / Cmd+V)
3. **Save the file:**
   - Press `Ctrl+X` (to exit)
   - Press `Y` (to confirm save)
   - Press `Enter` (to confirm filename)

---

## STEP 9: Verify It Worked

**SSH into your server** (if not already):
```bash
ssh root@72.62.134.99
```

**Check the file exists:**
```bash
ls -la /root/linkedin-job-scraper/credentials/google-sheets-credentials.json
```

**You should see:** The file listed with details like:
```
-rw-r--r-- 1 root root 2345 Feb  2 12:00 google-sheets-credentials.json
```

**If you see that, you're done!** ✅

---

## QUICK CHECKLIST

Go through each step and check it off:

- [ ] Step 1: Opened https://console.cloud.google.com
- [ ] Step 2: Created project named "LinkedIn Job Scraper"
- [ ] Step 3: Enabled Google Sheets API
- [ ] Step 4: Created service account named "linkedin-job-scraper"
- [ ] Step 5: Downloaded JSON key file
- [ ] Step 6: Copied the service account email from JSON file
- [ ] Step 7: Shared Google Sheet with service account email (Editor permission)
- [ ] Step 8: Uploaded JSON file to server
- [ ] Step 9: Verified file exists on server

---

## IF YOU GET STUCK

Tell me:
1. Which step number you're on
2. What you see on your screen
3. What error message (if any) you're getting

I'll help you through it!
