# 🚀 Greencare Analytics Dashboard - JamesGall12/Greencare-practitionersv2

## 📊 What This Does

- **Automatically fetches** data from your Google Sheets every 2 hours
- **Processes appointment data** from "Dashboard Data" sheet
- **Correlates discharge statistics** from "Discharge % Data" sheet  
- **Updates your beautiful dashboard** with live analytics
- **Hosts everything for free** on GitHub Pages

## ⚙️ Setup Instructions (15 minutes)

### Step 1: ✅ Repository Created
- **Repository**: JamesGall12/Greencare-practitionersv2
- **Spreadsheet ID**: 1Hyg8J2vEjFZ2TuJsVnIiY16SBZ8euHhlBDDJwIxGdIY

### Step 2: ✅ Files Added
All automation files have been added to the repository.

### Step 3: Configure Repository Secrets

1. **In your GitHub repository**: Settings → Secrets and variables → Actions
2. **Add these secrets**:
   - **Name**: `GOOGLE_SHEETS_API_KEY`
   - **Value**: `AIzaSyDiJm2zhhdrCN6_Q0aNRvcRpefAzOMYgT4`
   - **Name**: `SPREADSHEET_ID` 
   - **Value**: `1Hyg8J2vEjFZ2TuJsVnIiY16SBZ8euHhlBDDJwIxGdIY`

### Step 4: Make Your Google Sheet Public

1. **Open your data spreadsheet**
2. **Click "Share"** → **"Anyone with the link can view"**
3. **This allows GitHub Actions** to read your data

### Step 5: Enable GitHub Pages

1. **Repository Settings** → **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: `main` (or `master`)
4. **Folder**: `/ (root)`
5. **Save**

### Step 6: Test the System

1. **Go to Actions tab** in your repository
2. **Click "Update Greencare Dashboard Data"**
3. **Click "Run workflow"** → **"Run workflow"**
4. **Wait for it to complete** (green checkmark)
5. **Check your dashboard URL**: `https://jamesgall12.github.io/Greencare-practitionersv2/`

## 🔄 How It Works

### Data Processing Logic
1. **Fetches appointment data** from "Dashboard Data" sheet
2. **Counts completed appointments** per practitioner (date range filtered)
3. **Gets discharge numbers** from "Discharge % Data" sheet
4. **Calculates accurate percentages**: Discharges ÷ Completed Appointments × 100

### Automatic Updates
- **Every 2 hours** (9 AM - 5 PM AWST, Monday-Friday)
- **GitHub Actions** processes your Google Sheets data
- **Updates dashboard** automatically
- **Smart practitioner matching** (handles "Dr." variations)

## 📊 Your Dashboard URL

Your live dashboard will be available at:
https://jamesgall12.github.io/Greencare-practitionersv2/
## 📋 Data Structure

### "Dashboard Data" Sheet (Appointment Data):
- `INTERNALID` - Patient identifier
- `APPOINTMENTDATE` - Appointment date
- `APPOINTMENTWITH` - Practitioner name
- `APPOINTMENT_STATUS` - Outcome (Completed, DNA, etc.)
- `APPOINTMENTTYPE` - Initial/Follow-up
- `BOOKEDBY` - Sales team (empty = online)
- `SEX` - Patient demographics

### "Discharge % Data" Sheet (Discharge Statistics):
- `Practitioner` - Practitioner name
- `Patient Request Discharges` - Number
- `Practitioner Request Discharges` - Number  
- `Patient Requested %` - Calculated
- `Practitioner Requested %` - Calculated
- `Total %` - Calculated

## 👨‍⚕️ Practitioner Matching

The system intelligently matches these practitioner name variations:
- Jeremy Chou
- Hollie Johnson  
- Dr Sandhya / Sandhya
- Thomas, Julius, James, Emma, Ronnie, Luke, Laura, Vanessa, Jordan, Julia
- Dr. Kushal / Dr Kushal / Kushal

## 🔧 Customization

### Change Update Frequency
Edit `.github/workflows/update-dashboard.yml`:
```yaml
schedule:
  - cron: '0 */1 * * *'  # Every hour
  - cron: '0 9,12,15 * * 1-5'  # 9 AM, 12 PM, 3 PM weekdays
