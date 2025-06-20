// scripts/fetch-data.js
// Customized for JamesGall12/Greencare-practitionersv2
// June 2025 Analysis – Dynamically updated with proper date parsing

 const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  SPREADSHEET_ID: process.env.SPREADSHEET_ID || '1Hyg8J2vEjFZ2TuJsVnIiY16SBZ8euHhlBDDJwIxGdIY',
  API_KEY: process.env.GOOGLE_SHEETS_API_KEY,
  APPOINTMENT_SHEET: 'Dashboard Data',
  DISCHARGE_SHEET: 'Discharge % Data',
  OUTPUT_DIR: './data',
  APPOINTMENT_FILE: 'appointments.json',
  DISCHARGE_FILE: 'discharges.json',
  DASHBOARD_FILE: 'dashboard.json',
  ANALYSIS_MONTH: 6,
  ANALYSIS_YEAR: 2025,
  PRACTITIONERS: [
    'Jeremy Chou', 'Hollie Johnson', 'Dr Sandhya', 'Sandhya', 'Thomas', 'Julius',
    'Dr. Kushal', 'Dr Kushal', 'Kushal', 'James', 'Emma', 'Ronnie', 'Luke', 'Laura',
    'Vanessa', 'Jordan', 'Julia'
  ],
  COMPLETED_STATUSES: ['Completed', 'Attended', 'Finished', 'Complete'],
  DNA_STATUSES: ['DNA', 'Did Not Attend', 'No Show', 'NoShow'],
  CANCELLED_STATUSES: ['Cancelled', 'Canceled', 'Cancelled by Patient', 'Cancelled by Clinic']
};

async function main() {
  try {
    console.log('🚀 Starting Greencare June 2025 analytics update...');
    const sheets = google.sheets({ version: 'v4', auth: CONFIG.API_KEY });

    if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
      fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
    }

    const appointmentData = await fetchSheetData(sheets, CONFIG.APPOINTMENT_SHEET);
    const dischargeData = await fetchSheetData(sheets, CONFIG.DISCHARGE_SHEET);
    const dashboardData = processJuneAnalytics(appointmentData, dischargeData);

    saveJsonFile(CONFIG.APPOINTMENT_FILE, appointmentData);
    saveJsonFile(CONFIG.DISCHARGE_FILE, dischargeData);
    saveJsonFile(CONFIG.DASHBOARD_FILE, dashboardData);

    console.log('✅ Analytics update complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function fetchSheetData(sheets, sheetName) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.SPREADSHEET_ID,
      range: `${sheetName}!A:Z`
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    const headers = rows[0];
    return rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
  } catch (error) {
    console.error(`❌ Error fetching ${sheetName}:`, error.message);
    return [];
  }
}

function parseDate(raw) {
  if (!raw) return null;
  const cleaned = raw.split(' ')[0];
  const parts = cleaned.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  }
  const fallback = new Date(raw);
  return isNaN(fallback.getTime()) ? null : fallback;
}

function normalize(str) {
  return str.trim().replace(/\s+/g, ' ').toLowerCase();
}

function findMatchingPractitioner(name) {
  if (!name) return null;
  const cleaned = normalize(name);

  let match = CONFIG.PRACTITIONERS.find(p => normalize(p) === cleaned);
  if (match) return match;

  match = CONFIG.PRACTITIONERS.find(p =>
    cleaned.includes(normalize(p)) || normalize(p).includes(cleaned)
  );
  if (match) return match;

  const noTitle = cleaned.replace(/^(dr\.?|doctor)\s+/i, '');
  return CONFIG.PRACTITIONERS.find(p =>
    normalize(p).replace(/^(dr\.?|doctor)\s+/i, '') === noTitle
  ) || null;
}

function processJuneAnalytics(appointments, discharges) {
  const juneAppointments = appointments.filter(apt => {
    const date = parseDate(apt.APPOINTMENTDATE);
    return (
      date &&
      date.getMonth() === CONFIG.ANALYSIS_MONTH - 1 &&
      date.getFullYear() === CONFIG.ANALYSIS_YEAR &&
      apt.APPOINTMENTWITH
    );
  });

  const practitionerStats = {};
  CONFIG.PRACTITIONERS.forEach(name => {
    practitionerStats[name] = {
      name,
      totalAppointments: 0,
      completedAppointments: 0,
      dnaAppointments: 0,
      cancelledAppointments: 0,
      initialAppointments: 0,
      followupAppointments: 0,
      onlineBookings: 0,
      salesBookings: 0,
      uniquePatients: new Set(),
      malePatients: 0,
      femalePatients: 0,
      patientRequestedDischarges: 0,
      practitionerRequestedDischarges: 0,
      totalDischarges: 0,
      patientRequestedPercent: '0.00',
      practitionerRequestedPercent: '0.00',
      totalDischargePercent: '0.00',
      showRate: '0.00',
      completionRate: '0.00'
    };
  });

  juneAppointments.forEach(apt => {
    const practitioner = findMatchingPractitioner(apt.APPOINTMENTWITH);
    if (!practitioner || !practitionerStats[practitioner]) return;

    const stats = practitionerStats[practitioner];
    const status = apt.APPOINTMENT_STATUS || '';
    const appointmentType = apt.APPOINTMENTTYPE || '';
    const bookedBy = apt.BOOKEDBY || '';
    const sex = apt.SEX || '';

    stats.totalAppointments++;
    stats.uniquePatients.add(apt.INTERNALID);

    if (CONFIG.COMPLETED_STATUSES.some(cs => status.toLowerCase().includes(cs.toLowerCase()))) {
      stats.completedAppointments++;
    } else if (CONFIG.DNA_STATUSES.some(ds => status.toLowerCase().includes(ds.toLowerCase()))) {
      stats.dnaAppointments++;
    } else if (CONFIG.CANCELLED_STATUSES.some(cs => status.toLowerCase().includes(cs.toLowerCase()))) {
      stats.cancelledAppointments++;
    }

    const typeLower = appointmentType.toLowerCase();
    if (typeLower.includes('initial') || typeLower.includes('new')) {
      stats.initialAppointments++;
    } else if (typeLower.includes('follow') || typeLower.includes('review')) {
      stats.followupAppointments++;
    }

    if (bookedBy.trim() === '') {
      stats.onlineBookings++;
    } else {
      stats.salesBookings++;
    }

    if (sex.toLowerCase().includes('male') || sex.toLowerCase() === 'm') {
      stats.malePatients++;
    } else if (sex.toLowerCase().includes('female') || sex.toLowerCase() === 'f') {
      stats.femalePatients++;
    }
  });

  discharges.forEach(discharge => {
    const practitioner = findMatchingPractitioner(discharge.Practitioner);
    if (!practitioner || !practitionerStats[practitioner]) return;

    const stats = practitionerStats[practitioner];
    stats.patientRequestedDischarges = parseInt(discharge['Patient Request Discharges']) || 0;
    stats.practitionerRequestedDischarges = parseInt(discharge['Practitioner Request Discharges']) || 0;
    stats.totalDischarges = stats.patientRequestedDischarges + stats.practitionerRequestedDischarges;
  });

  Object.values(practitionerStats).forEach(stats => {
    stats.uniquePatients = stats.uniquePatients.size;

    if (stats.completedAppointments > 0) {
      stats.patientRequestedPercent = (stats.patientRequestedDischarges / stats.completedAppointments * 100).toFixed(2);
      stats.practitionerRequestedPercent = (stats.practitionerRequestedDischarges / stats.completedAppointments * 100).toFixed(2);
      stats.totalDischargePercent = (stats.totalDischarges / stats.completedAppointments * 100).toFixed(2);
    }

    if (stats.totalAppointments > 0) {
      const showAppointments = stats.completedAppointments + stats.dnaAppointments;
      stats.showRate = (showAppointments / stats.totalAppointments * 100).toFixed(2);
      stats.completionRate = (stats.completedAppointments / stats.totalAppointments * 100).toFixed(2);
    }
  });

  const juneDates = juneAppointments
    .map(apt => parseDate(apt.APPOINTMENTDATE))
    .filter(date => date && date.getMonth() === 5 && date.getFullYear() === 2025)
    .sort((a, b) => a - b);

  const juneRange = juneDates.length > 0 ? {
    startDate: '2025-06-01',
    endDate: juneDates[juneDates.length - 1].toISOString().split('T')[0],
    appointmentCount: juneDates.length,
    month: 'June 2025 (up to ' + juneDates[juneDates.length - 1].toLocaleDateString('en-AU') + ')'
  } : {
    startDate: '2025-06-01',
    endDate: '2025-06-30',
    appointmentCount: 0,
    month: 'June 2025'
  };

  return {
    lastUpdated: new Date().toISOString(),
    analysisMonth: 'June 2025',
    juneAppointments: {
      total: juneAppointments.length,
      completed: Object.values(practitionerStats).reduce((sum, s) => sum + s.completedAppointments, 0),
      dateRange: juneRange
    },
    summary: {
      totalAppointments: Object.values(practitionerStats).reduce((sum, s) => sum + s.totalAppointments, 0),
      totalCompletedAppointments: Object.values(practitionerStats).reduce((sum, s) => sum + s.completedAppointments, 0),
      totalDischarges: Object.values(practitionerStats).reduce((sum, s) => sum + s.totalDischarges, 0),
      avgCompletionRate: (Object.values(practitionerStats).reduce((sum, s) => sum + parseFloat(s.completionRate), 0) / CONFIG.PRACTITIONERS.length).toFixed(2),
      avgDischargeRate: (Object.values(practitionerStats).reduce((sum, s) => sum + parseFloat(s.totalDischargePercent), 0) / CONFIG.PRACTITIONERS.length).toFixed(2),
      totalPractitioners: CONFIG.PRACTITIONERS.length
    },
    practitioners: practitionerStats
  };
}

function saveJsonFile(filename, data) {
  const filepath = path.join(CONFIG.OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`💾 Saved: ${filepath}`);
}

if (require.main === module) {
  main();
}

