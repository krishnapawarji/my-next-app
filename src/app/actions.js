"use server";
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import dotenv from 'dotenv';

dotenv.config();

const credsParsed = {
  type: process.env.GOOGLE_TYPE,
  project_id: process.env.GOOGLE_PROJECT_ID,
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_CLIENT_ID,
  auth_uri: process.env.GOOGLE_AUTH_URI,
  token_uri: process.env.GOOGLE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL
};

// User-provided Spreadsheet ID
const SPREADSHEET_ID = '1Rs3oBtF-WDw0vMlYZS8wwWuL79jRJZBHjpqfmwrQI-k';

const auth = new JWT({
  email: credsParsed.client_email,
  key: credsParsed.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(SPREADSHEET_ID, auth);

async function getSheet(name) {
  await doc.loadInfo();
  return name ? doc.sheetsByTitle[name] : doc.sheetsByIndex[0];
}

export async function getAttendanceRecords() {
  try {
    const sheet = await getSheet();
    const rows = await sheet.getRows();
    
    const records = rows.map(row => {
      const data = row.toObject();
      return {
        id: data['ID'] || data['Raw In'] || Math.random().toString(), 
        date: data['Date'] || '-',
        empId: data['Emp ID'] || '-',
        name: data['Name'] || '-',
        email: data['Email'] || '-',
        inTime: data['In Time'] || '-',
        outTime: data['Out Time'] || '-',
        hours: data['Hours'] || '-',
        status: data['Status'] || '-',
        location: data['Location'] || '-',
        leaveType: data['Leave Type'] || '-',
        remark: data['Remark'] || '-',
        rawIn: data['Raw In'] || '-'
      };
    });
    
    // Return latest records first for the UI
    return records.reverse();
  } catch (err) {
    console.error("Failed to fetch from Google Sheets:", err);
    return [];
  }
}

function getPunchInStatus(now) {
  // All thresholds in IST (hours and minutes)
  const h = now.getHours();
  const m = now.getMinutes();
  const totalMinutes = h * 60 + m;

  const HALF_DAY     = 14 * 60;       // 2:00 PM
  const SHORT_LEAVE  = 12 * 60;       // 12:00 PM
  const LATE_MARK    = 10 * 60 + 30;  // 10:30 AM

  if (totalMinutes >= HALF_DAY)    return 'Half Day';
  if (totalMinutes >= SHORT_LEAVE) return 'Short Leave';
  if (totalMinutes >  LATE_MARK)   return 'Late Mark';
  return 'On Time';
}

export async function punchIn(data) {
  const sheet = await getSheet();
  const now   = new Date();
  const rawIn = now.toISOString();
  const status = getPunchInStatus(now);

  await sheet.addRow({
    'Raw In':     rawIn,
    'Date':       data.date,
    'Emp ID':     data.empId,
    'Name':       data.name,
    'Email':      data.email,
    'In Time':    data.inTime,
    'Out Time':   '-',
    'Hours':      '-',
    'Status':     status,
    'Location':   data.location,
    'Leave Type': '-',
    'Remark':     data.remark
  });

  revalidatePath('/');
  return { id: rawIn, rawIn, status };
}


export async function punchOut(activeRecordId, outTime, hours) {
  const sheet = await getSheet();
  const rows = await sheet.getRows();
  
  const targetRow = rows.find(r => r.get('ID') === activeRecordId || r.get('Raw In') === activeRecordId);
  
  if (targetRow) {
    targetRow.assign({
      'Out Time': outTime,
      'Hours': hours
    });
    await targetRow.save();
  }
  
  revalidatePath('/');
  return { success: true };
}

// ── Auth Actions ──────────────────────────────────────────────────────────────

export async function loginUser(formData) {
  const name = formData.get('name')?.trim();
  const password = formData.get('password')?.trim();

  if (!name || !password) {
    return { success: false, error: 'Please fill in all fields.' };
  }

  try {
    const sheet = await getSheet('user');
    if (!sheet) return { success: false, error: 'User data unavailable. Contact admin.' };
    const rows = await sheet.getRows();

    const matched = rows.find(row => {
      const rowName = (row.get('Name') || '').trim();
      const rowPass = (row.get('Password') || '').trim();
      return rowName.toLowerCase() === name.toLowerCase() && rowPass === password;
    });

    if (!matched) {
      return { success: false, error: 'Invalid name or password.' };
    }

    const user = {
      empId:  matched.get('Client Id') || '',
      name:   matched.get('Name') || '',
      email:  matched.get('Email') || '',
      role:   matched.get('Role') || 'Employee',
    };

    const cookieStore = await cookies();
    cookieStore.set('hrms_session', JSON.stringify(user), {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
      sameSite: 'lax',
    });

    return { success: true, user };
  } catch (err) {
    console.error('Login error:', err);
    return { success: false, error: 'Server error. Please try again.' };
  }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete('hrms_session');
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const raw = cookieStore.get('hrms_session')?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ── Leave Actions ─────────────────────────────────────────────────────────────

export async function getLeaveHistory() {
  try {
    const user = await getSessionUser();
    if (!user) return [];
    const sheet = await getSheet('Leave');
    if (!sheet) return [];
    const rows = await sheet.getRows();
    return rows
      .filter(r => (r.get('Employee ID') || '') === user.empId)
      .map(r => ({
        type:   r.get('Leave Purpose') || '-',
        dates:  `${r.get('Start Date') || ''} → ${r.get('End Date') || ''}`,
        days:   r.get('Total Days') || '-',
        reason: r.get('Reason for leave') || '-',
        status: r.get('Status') || 'Pending',
      }))
      .reverse();
  } catch (err) {
    console.error('getLeaveHistory error:', err);
    return [];
  }
}

export async function applyLeave(formData) {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: 'Not logged in.' };

    const sheet = await getSheet('Leave');
    if (!sheet) return { success: false, error: 'Leave sheet not found. Please ask admin to create it.' };

    const startDate  = formData.get('startDate')  || '';
    const endDate    = formData.get('endDate')    || '';
    const totalDays  = formData.get('totalDays')  || '0';
    const timestamp  = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' });
    const declared   = formData.get('declaration') === 'on' ? 'Yes' : 'No';

    // Columns A → Q  matching the Leave sheet exactly
    await sheet.addRow({
      'Employee ID':                user.empId,                              // A
      'Timestamp':                  timestamp,                               // B
      'Name':                       user.name,                               // C
      'Designation':                formData.get('designation') || '',       // D
      'Leave Purpose':              formData.get('leaveType')   || '',       // E
      'Department':                 formData.get('department')  || '',       // F
      'Start Date':                 startDate,                               // G
      'End Date':                   endDate,                                 // H
      'Total Days':                 totalDays,                               // I
      'Reason for leave':           formData.get('reason')      || '',       // J
      'Contact Info during absence':formData.get('emergencyContact') || '',  // K
      'Reporting Manager Name':     formData.get('manager')     || '',       // L
      'Replacement Person':         formData.get('replacementPerson') || '', // M
      'Declaration':                declared,                                // N
      'Will you be available for any work related queries during my leave period?':
                                    formData.get('availability') || '',      // O
      'Status':                     'Pending',                               // P
      'Approval':                   '',                                      // Q
    });

    revalidatePath('/leave');
    return { success: true };
  } catch (err) {
    console.error('applyLeave error:', err);
    return { success: false, error: 'Server error. Please try again.' };
  }
}
