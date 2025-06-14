// scripts/fetch-data.js
// Customized for JamesGall12/Greencare-practitionersv2
// June 2025 Analysis - Matches discharge data period

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Configuration for your specific setup
const CONFIG = {
  SPREADSHEET_ID: process.env.SPREADSHEET_ID || '1Hyg8J2vEjFZ2TuJsVnIiY16SBZ8euHhlBDDJwIxGdIY',
  API_KEY: process.env.GOOGLE_SHEETS_API_KEY,
  
  // Your sheet names
  APPOINTMENT_SHEET: 'Dashboard Data',      // Contains appointment data
  DISCHARGE_SHEET: 'Discharge % Data',      // Contains discharge statistics
  
  // Output paths
  OUTPUT_DIR: './data',
  APPOINTMENT_FILE: 'appointments.json',
  DISCHARGE_FILE: 'discharges.json',
  DASHBOARD_FILE: 'dashboard.json',
  
  // June 2025 date range (matches discharge data)
  ANALYSIS_MONTH: 6,      // June
  ANALYSIS_YEAR: 2025,    // 2025
  
  // Your practitioners (with smart matching)
  PRACTITIONERS: [
    'Jeremy Chou', 'Hollie Johnson', 'Dr Sandhya', 'Sandhya', 'Thomas', 'Julius', 
    'Dr. Kushal', 'Dr Kushal', 'Kushal', 'James', 'Emma', 'Ronnie', 'Luke', 'Laura', 
    'Vanessa', 'Jordan', 'Julia'
  ],
  
  // Status classifications for appointments
  COMPLETED_STATUSES: ['Completed', 'Attended', 'Finished', 'Complete'],
  DNA_STATUSES: ['DNA', 'Did Not Attend', 'No Show', 'NoShow'],
  CANCELLED_STATUSES: ['Cancelled', 'Canceled', 'Cancelled by Patient', 'Cancelled by Clinic']
};

async function main() {
  try {
    console.log('🚀 Starting Greencare June 2025 analytics update...');
    console.log(`📊 Repository: JamesGall12/Greencare-practitionersv2`);
    console.log(`📅 Analysis Period: June 2025 (matching discharge data)`);
    
    // Initialize Google Sheets API
    const sheets = google.sheets({ version: 'v4', auth: CONFIG.API_KEY });
    
    // Ensure output directory exists
    if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
      fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
    }
    
    // Fetch appointment data from "Dashboard Data" sheet
    console.log('📅 Fetching appointment data from "Dashboard Data" sheet...');
    const appointmentData = await fetchSheetData(sheets, CONFIG.APPOINTMENT_SHEET);
    
    // Fetch discharge statistics from "Discharge % Data" sheet
    console.log('💔 Fetching discharge data from "Discharge % Data" sheet...');
    const dischargeData = await fetchSheetData(sheets, CONFIG.DISCHARGE_SHEET);
    
    // Process June 2025 analytics
    console.log('🔄 Processing June 2025 analytics...');
    const dashboardData = processJuneAnalytics(appointmentData, dischargeData);
    
    // Save all data files
    saveJsonFile(CONFIG.APPOINTMENT_FILE, appointmentData);
    saveJsonFile(CONFIG.DISCHARGE_FILE, dischargeData);
    saveJsonFile(CONFIG.DASHBOARD_FILE, dashboardData);
    
    console.log('✅ Greencare June 2025 analytics update complete!');
    console.log(`📊 Processed ${dashboardData.juneAppointments.total} June appointments`);
    console.log(`💔 Processed ${dischargeData.length} discharge records`);
    console.log(`👨‍⚕️ Analytics for ${Object.keys(dashboardData.practitioners).length} practitioners`);
    
  } catch (error) {
    console.error('❌ Error updating analytics:', error.message);
    process.exit(1);
  }
}

async function fetchSheetData(sheets, sheetName) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.SPREADSHEET_ID,
      range: `${sheetName}!A:Z`, // Get all columns
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.warn(`⚠️  No data found in sheet: ${sheetName}`);
      return [];
    }
    
    // Convert to objects using first row as headers
    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
    
    console.log(`✅ Loaded ${data.length} rows from "${sheetName}"`);
    return data;
    
  } catch (error) {
    console.error(`❌ Error fetching sheet ${sheetName}:`, error.message);
    return [];
  }
}

function processJuneAnalytics(appointments, discharges) {
  // Filter appointments to June 2025 only
  const juneAppointments = appointments.filter(apt => {
    if (!apt.APPOINTMENTDATE || !apt.APPOINTMENTWITH) return false;
    
    const aptDate = new Date(apt.APPOINTMENTDATE);
    return aptDate.getMonth() === CONFIG.ANALYSIS_MONTH - 1 && // JavaScript months are 0-indexed
           aptDate.getFullYear() === CONFIG.ANALYSIS_YEAR;
  });
  
  console.log(`📅 Filtered to ${juneAppointments.length} June 2025 appointments`);
  
  // Initialize practitioner stats
  const practitionerStats = {};
  CONFIG.PRACTITIONERS.forEach(name => {
    practitionerStats[name] = {
      name: name,
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
      
      // Discharge data (from Discharge % Data sheet)
      patientRequestedDischarges: 0,
      practitionerRequestedDischarges: 0,
      totalDischarges: 0,
      
      // Calculated percentages
      patientRequestedPercent: '0.00',
      practitionerRequestedPercent: '0.00',
      totalDischargePercent: '0.00',
      showRate: '0.00',
      completionRate: '0.00'
    };
  });
  
  // Process June appointment data
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
    
    // Status classification
    if (CONFIG.COMPLETED_STATUSES.some(cs => status.toLowerCase().includes(cs.toLowerCase()))) {
      stats.completedAppointments++;
    } else if (CONFIG.DNA_STATUSES.some(ds => status.toLowerCase().includes(ds.toLowerCase()))) {
      stats.dnaAppointments++;
    } else if (CONFIG.CANCELLED_STATUSES.some(cs => status.toLowerCase().includes(cs.toLowerCase()))) {
      stats.cancelledAppointments++;
    }
    
    // Appointment type classification
    const typeLower = appointmentType.toLowerCase();
    if (typeLower.includes('initial') || typeLower.includes('new')) {
      stats.initialAppointments++;
    } else if (typeLower.includes('follow') || typeLower.includes('review')) {
      stats.followupAppointments++;
    }
    
    // Booking source (empty BOOKEDBY = online)
    if (bookedBy.trim() === '') {
      stats.onlineBookings++;
    } else {
      stats.salesBookings++;
    }
    
    // Demographics
    if (sex.toLowerCase().includes('male') || sex.toLowerCase() === 'm') {
      stats.malePatients++;
    } else if (sex.toLowerCase().includes('female') || sex.toLowerCase() === 'f') {
      stats.femalePatients++;
    }
  });
  
  // Process discharge data from "Discharge % Data" sheet (June data)
  discharges.forEach(discharge => {
    const practitioner = findMatchingPractitioner(discharge.Practitioner);
    if (!practitioner || !practitionerStats[practitioner]) return;
    
    const stats = practitionerStats[practitioner];
    
    // Get June discharge numbers from your sheet
    stats.patientRequestedDischarges = parseInt(discharge['Patient Request Discharges']) || 0;
    stats.practitionerRequestedDischarges = parseInt(discharge['Practitioner Request Discharges']) || 0;
    stats.totalDischarges = stats.patientRequestedDischarges + stats.practitionerRequestedDischarges;
  });
  
  // Calculate final metrics and percentages
  Object.values(practitionerStats).forEach(stats => {
    const uniquePatientCount = stats.uniquePatients.size;
    const completedAppointments = stats.completedAppointments;
    
    stats.uniquePatients = uniquePatientCount; // Convert Set to number
    
    // Calculate rates based on completed appointments
    if (completedAppointments > 0) {
      stats.patientRequestedPercent = (stats.patientRequestedDischarges / completedAppointments * 100).toFixed(2);
      stats.practitionerRequestedPercent = (stats.practitionerRequestedDischarges / completedAppointments * 100).toFixed(2);
      stats.totalDischargePercent = (stats.totalDischarges / completedAppointments * 100).toFixed(2);
    }
    
    // Show rate and completion rate
    if (stats.totalAppointments > 0) {
      const showAppointments = stats.completedAppointments + stats.dnaAppointments;
      stats.showRate = (showAppointments / stats.totalAppointments * 100).toFixed(2);
      stats.completionRate = (stats.completedAppointments / stats.totalAppointments * 100).toFixed(2);
    }
  });
  
  // Generate summary statistics
  const totalAppointments = Object.values(practitionerStats).reduce((sum, stats) => sum + stats.totalAppointments, 0);
  const totalCompletedAppointments = Object.values(practitionerStats).reduce((sum, stats) => sum + stats.completedAppointments, 0);
  const totalDischarges = Object.values(practitionerStats).reduce((sum, stats) => sum + stats.totalDischarges, 0);
  const avgCompletionRate = Object.values(practitionerStats).reduce((sum, stats) => sum + parseFloat(stats.completionRate), 0) / CONFIG.PRACTITIONERS.length;
  const avgDischargeRate = Object.values(practitionerStats).reduce((sum, stats) => sum + parseFloat(stats.totalDischargePercent), 0) / CONFIG.PRACTITIONERS.length;
  
  // Calculate June date range from actual data
  const juneDates = juneAppointments
    .map(apt => new Date(apt.APPOINTMENTDATE))
    .filter(date => !isNaN(date.getTime()))
    .sort((a, b) => a - b);
  
  const juneRange = juneDates.length > 0 ? {
    startDate: juneDates[0].toISOString().split('T')[0],
    endDate: juneDates[juneDates.length - 1].toISOString().split('T')[0],
    appointmentCount: juneDates.length,
    month: 'June 2025'
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
      completed: totalCompletedAppointments,
      dateRange: juneRange
    },
    summary: {
      totalAppointments,
      totalCompletedAppointments,
      totalDischarges,
      avgCompletionRate: avgCompletionRate.toFixed(2),
      avgDischargeRate: avgDischargeRate.toFixed(2),
      totalPractitioners: CONFIG.PRACTITIONERS.length
    },
    practitioners: practitionerStats
  };
}

function findMatchingPractitioner(name) {
  if (!name) return null;
  
  const cleaned = name.trim().replace(/\s+/g, ' ');
  
  // Try exact match first
  let match = CONFIG.PRACTITIONERS.find(p => 
    p.toLowerCase() === cleaned.toLowerCase()
  );
  
  if (match) return match;
  
  // Try partial match (handles Dr./Dr variations)
  match = CONFIG.PRACTITIONERS.find(p => 
    cleaned.toLowerCase().includes(p.toLowerCase()) ||
    p.toLowerCase().includes(cleaned.toLowerCase())
  );
  
  if (match) return match;
  
  // Try without titles (Dr, Dr.)
  const cleanedNoTitle = cleaned.replace(/^(dr\.?|doctor)\s+/i, '');
  match = CONFIG.PRACTITIONERS.find(p => {
    const pNoTitle = p.replace(/^(dr\.?|doctor)\s+/i, '');
    return cleanedNoTitle.toLowerCase() === pNoTitle.toLowerCase();
  });
  
  return match || null;
}

function saveJsonFile(filename, data) {
  const filepath = path.join(CONFIG.OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`💾 Saved: ${filepath}`);
}

// Run the script
if (require.main === module) {
  main();
}
