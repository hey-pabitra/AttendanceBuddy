
# Setup Instructions

## 1. Google Sheets Setup
1. Create a new Google Sheet.
2. Go to **Extensions > Apps Script**.
3. Delete any existing code and paste the contents of `backend.gs` provided in this package.
4. Click **Deploy > New Deployment**.
5. Select **Web App**.
6. Set **Execute as** to "Me" and **Who has access** to "Anyone".
7. Deploy and copy the **Web App URL**.

## 2. Frontend Configuration
1. Open `constants.ts`.
2. Replace the placeholder `GAS_URL` with your actual **Web App URL**.

## 3. Usage
- The app automatically loads the last entry date and shows current stats.
- Select a date; the timetable for that day (Mon-Sat) will auto-load.
- Mark statuses (P, A, MB, NC) and add remarks.
- Use "Holiday" to mark all classes as "No Class".
- Click "Save Attendance" to sync with Google Sheets.
- Stats update automatically after every save.
