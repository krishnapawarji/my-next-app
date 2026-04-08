"use server";
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

// User-provided Spreadsheet ID
const SPREADSHEET_ID = '1Rs3oBtF-WDw0vMlYZS8wwWuL79jRJZBHjpqfmwrQI-k';

// ── Lazy credential & doc loader ───────────────────────────────────────────────
let _doc = null;

function getCredentials() {
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    return JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
  }
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return {
      type: process.env.GOOGLE_TYPE || 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: process.env.GOOGLE_AUTH_URI,
      token_uri: process.env.GOOGLE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL,
      client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
    };
  }
  const filePath = path.join(process.cwd(), 'google-credentials.json');
  if (!fs.existsSync(filePath)) {
    throw new Error('Google credentials not found.');
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getDoc() {
  if (_doc) return _doc;
  const creds = getCredentials();
  const auth = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  _doc = new GoogleSpreadsheet(SPREADSHEET_ID, auth);
  return _doc;
}

async function getSheet(name) {
  try {
    const doc = getDoc();
    await doc.loadInfo();
    if (name) {
      const sheet = doc.sheetsByTitle[name];
      if (!sheet) {
        console.warn(`⚠️ Sheet tab "${name}" not found.`);
        return { _mock: true };
      }
      return sheet;
    }
    return doc.sheetsByIndex[0];
  } catch (err) {
    return { _mock: true };
  }
}

// ── Mock Storage ──
let _mockAttendance = [
  { id: 'm1', date: 'Sat 28 Mar', empId: 'EMP102', name: 'krishna Pawar', email: 'pawarkrishna285@gmail.com', inTime: '09:12:44 AM', outTime: '-', hours: '-', status: 'On Time', location: '19.0760, 72.8777', remark: 'Mock Record' }
];
let _mockLeaves = [
  { empId: 'EMP102', type: 'Sick Leave', start: '2026-03-20', end: '2026-03-21', days: '2', reason: 'Fever', status: 'Pending' }
];
let _mockTravel = [
  { id: 't1', date: '2026-03-30', empId: 'EMP101', name: 'Krishna Pawar', destination: 'Mumbai', category: 'Flight', amount: '5400', status: 'Approved', remarks: 'Client Visit' }
];
let _mockAdvanceSalary = [
  { id: 'a1', timestamp: '01/04/2026, 10:30:00', name: 'Krishna Pawar', empId: 'EMP101', department: 'IT', amount: '5000', reason: 'Medical Emergency', dateNeeded: '2026-04-10', months: '2', status: 'Approved' }
];

// ── Attendance Actions ──

export async function getAttendanceRecords() {
  try {
    const sheet = await getSheet();
    if (sheet._mock) return [..._mockAttendance].reverse();
    const rows = await sheet.getRows();
    return rows.map(row => {
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
    }).reverse();
  } catch (err) {
    return [..._mockAttendance].reverse();
  }
}

function getPunchInStatus(now) {
  const h = now.getHours();
  const m = now.getMinutes();
  const totalMinutes = h * 60 + m;
  const HALF_DAY = 14 * 60;
  const SHORT_LEAVE = 12 * 60;
  const LATE_MARK = 10 * 60 + 30;
  if (totalMinutes >= HALF_DAY) return 'Half Day';
  if (totalMinutes >= SHORT_LEAVE) return 'Short Leave';
  if (totalMinutes > LATE_MARK) return 'Late Mark';
  return 'On Time';
}

export async function punchIn(data) {
  const sheet = await getSheet();
  const now = new Date();
  const rawIn = now.toISOString();
  const status = getPunchInStatus(now);
  const user = await getSessionUser();
  if (sheet._mock) {
    _mockAttendance.push({
      id: rawIn, rawIn, date: data.date, empId: user?.empId || 'MOCK-101',
      name: user?.name || 'Mock User', email: user?.email || 'mock@example.com',
      inTime: data.inTime, outTime: '-', hours: '-', status,
      location: data.location, remark: data.remark
    });
    revalidatePath('/attendance');
    return { id: rawIn, rawIn, status };
  }
  await sheet.addRow({
    'Raw In': rawIn, 'Date': data.date, 'Emp ID': user?.empId || '-',
    'Name': user?.name || '-', 'Email': user?.email || '-',
    'In Time': data.inTime, 'Out Time': '-', 'Hours': '-',
    'Status': status, 'Location': data.location, 'Remark': data.remark
  });
  revalidatePath('/attendance');
  return { id: rawIn, rawIn, status };
}

export async function punchOut(activeRecordId, outTime, hours) {
  const sheet = await getSheet();
  if (sheet._mock) {
    const rec = _mockAttendance.find(r => r.id === activeRecordId || r.rawIn === activeRecordId);
    if (rec) { rec.outTime = outTime; rec.hours = hours; }
    revalidatePath('/attendance');
    return { success: true };
  }
  const rows = await sheet.getRows();
  const targetRow = rows.find(r => r.get('ID') === activeRecordId || r.get('Raw In') === activeRecordId);
  if (targetRow) {
    targetRow.assign({ 'Out Time': outTime, 'Hours': hours });
    await targetRow.save();
  }
  revalidatePath('/attendance');
  return { success: true };
}

export async function autoPunchOut(activeRecordId, rawInISO) {
  try {
    const now = new Date();
    let hoursString = '00:00';
    if (rawInISO) {
      const start = new Date(rawInISO);
      if (!isNaN(start)) {
        const diffMs = now - start;
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        hoursString = `${diffHrs.toString().padStart(2, '0')}:${diffMins.toString().padStart(2, '0')}`;
      }
    }
    const outTime = now.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
      timeZone: 'Asia/Kolkata',
    });
    const sheet = await getSheet();
    if (sheet._mock) {
      const rec = _mockAttendance.find(r => r.id === activeRecordId || r.rawIn === activeRecordId);
      if (rec) { rec.outTime = outTime; rec.hours = hoursString; }
      revalidatePath('/attendance');
      return { success: true, outTime, hours: hoursString };
    }
    const rows = await sheet.getRows();
    const targetRow = rows.find(r => r.get('Raw In') === activeRecordId || r.get('ID') === activeRecordId);
    if (targetRow) {
      targetRow.assign({
        'Out Time': outTime, 'Hours': hoursString,
        'Remark': (targetRow.get('Remark') || '') + ' | Auto Punch-Out (6 PM)'
      });
      await targetRow.save();
    }
    revalidatePath('/attendance');
    return { success: true, outTime, hours: hoursString };
  } catch (err) { return { success: false, error: err.message }; }
}

// ── Auth Actions ──

export async function loginUser(formData) {
  const name = formData.get('name')?.trim();
  const password = formData.get('password')?.trim();
  if (!name || !password) return { success: false, error: 'Please fill in all fields.' };
  try {
    const sheet = await getSheet('user');
    if (sheet._mock) {
      let role = 'Employee';
      let empId = 'EMP102';
      let email = 'pawarkrishna285@gmail.com';
      if (name.toLowerCase().includes('manager')) { role = 'Manager'; empId = 'MGR001'; email = 'manager@aura.com'; }
      else if (name.toLowerCase().includes('hr')) { role = 'HR'; empId = 'HR001'; email = 'hr@aura.com'; }
      const user = { empId, name, email, role };
      const cookieStore = await cookies();
      cookieStore.set('hrms_session', JSON.stringify(user), { httpOnly: true, path: '/', maxAge: 60 * 60 * 8, sameSite: 'lax' });
      return { success: true, user };
    }
    const rows = await sheet.getRows();
    const matched = rows.find(row => (row.get('Name') || '').trim().toLowerCase() === name.toLowerCase() && (row.get('Password') || '').trim() === password);
    if (!matched) return { success: false, error: 'Invalid name or password.' };
    const user = { empId: matched.get('Client Id') || '', name: matched.get('Name') || '', email: matched.get('Email') || '', role: matched.get('Role') || 'Employee' };
    const cookieStore = await cookies();
    cookieStore.set('hrms_session', JSON.stringify(user), { httpOnly: true, path: '/', maxAge: 60 * 60 * 8, sameSite: 'lax' });
    return { success: true, user };
  } catch (err) { return { success: false, error: 'Server error. Please try again.' }; }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete('hrms_session');
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const raw = cookieStore.get('hrms_session')?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// ── Leave Actions ──

export async function getLeaveHistory() {
  try {
    const user = await getSessionUser();
    if (!user) return { myHistory: [], teamPending: [], teamHistory: [] };
    const sheet = await getSheet('leave');
    if (sheet._mock) {
      const myHistory = _mockLeaves.filter(r => r.empId === user.empId).map(r => ({ id: `${r.start}-${r.empId}`, type: r.type, dates: `${r.start} → ${r.end}`, days: r.days, reason: r.reason, status: r.status, notes: r.notes || '', applicant: r.name || 'Unknown' })).reverse();
      const teamPending = user.role === 'Manager' ? _mockLeaves.filter(r => r.status === 'Pending' && r.empId !== user.empId).map(r => ({ id: `${r.start}-${r.empId}`, type: r.type, dates: `${r.start} → ${r.end}`, days: r.days, reason: r.reason, status: r.status, applicant: r.name || 'Emp' + r.empId })) : user.role === 'HR' ? _mockLeaves.filter(r => r.status === 'Approved by Manager' && r.empId !== user.empId).map(r => ({ id: `${r.start}-${r.empId}`, type: r.type, dates: `${r.start} → ${r.end}`, days: r.days, reason: r.reason, status: r.status, applicant: r.name || 'Emp' + r.empId })) : [];
      const teamHistory = (user.role === 'Manager' || user.role === 'HR') ? _mockLeaves.filter(r => { if (user.role === 'Manager') return r.status !== 'Pending' && r.empId !== user.empId; if (user.role === 'HR') return r.status === 'Approved' || r.status === 'Rejected'; return false; }).map(r => ({ id: `${r.start}-${r.empId}`, type: r.type, dates: `${r.start} → ${r.end}`, days: r.days, reason: r.reason, status: r.status, notes: r.notes || '', applicant: r.name || 'Emp' + r.empId })) : [];
      return { myHistory, teamPending, teamHistory };
    }
    const rows = await sheet.getRows();
    const allRecords = rows.map(r => ({
      id: r.get('Timestamp') || '', empId: r.get('Employee ID') || '', applicant: r.get('Name') || '',
      type: r.get('Leave Purpose') || '-', dates: `${r.get('Start Date') || ''} → ${r.get('End Date') || ''}`,
      days: r.get('Total Days') || '-', reason: r.get('Reason for leave') || '-',
      status: r.get('Manager Status') || 'Pending', notes: r.get('Manager Notes') || '',
      responsible: r.get('Responsible Person (Inabsence)') || '', manager: r.get('Reporting Manager Name') || ''
    }));
    const myHistory = allRecords.filter(r => r.empId === user.empId).reverse();
    const canApprove = user.role === 'Manager' || user.role === 'HR';
    let teamPending = []; let teamHistory = [];
    if (canApprove) {
      if (user.role === 'Manager') {
        teamPending = allRecords.filter(r => r.manager === user.name && r.status === 'Pending').reverse();
        teamHistory = allRecords.filter(r => r.manager === user.name && r.status !== 'Pending').reverse();
      } else if (user.role === 'HR') {
        teamPending = allRecords.filter(r => r.status === 'Approved by Manager').reverse();
        teamHistory = allRecords.filter(r => r.status === 'Approved' || r.status === 'Rejected').reverse();
      }
    }
    return { myHistory, teamPending, teamHistory };
  } catch (err) { return { myHistory: [], teamPending: [], teamHistory: [] }; }
}

export async function updateLeaveStatus(leaveId, status, notes, responsiblePerson = '') {
  try {
    const user = await getSessionUser();
    const canApprove = user?.role === 'Manager' || user?.role === 'HR';
    if (!user || !canApprove) return { success: false, error: 'Unauthorized' };
    let finalStatus = status;
    if (status === 'Approved' && user.role === 'Manager') finalStatus = 'Approved by Manager';
    const sheet = await getSheet('leave');
    if (sheet._mock) {
      const rec = _mockLeaves.find(r => `${r.start}-${r.empId}` === leaveId);
      if (rec) { rec.status = finalStatus; rec.notes = notes; rec.responsible = responsiblePerson; }
      revalidatePath('/leave'); return { success: true };
    }
    const rows = await sheet.getRows();
    const targetRow = rows.find(r => r.get('Timestamp') === leaveId);
    if (targetRow) {
      targetRow.assign({
        'Manager Status': finalStatus,
        'Responsible Person (Inabsence)': responsiblePerson,
        'Manager Notes': notes
      });
      await targetRow.save();
      revalidatePath('/leave');
      return { success: true };
    }
    return { success: false, error: 'Request not found' };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function applyLeave(formData) {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: 'Not logged in.' };
    const sheet = await getSheet('leave');
    const startDate = formData.get('startDate') || '';
    const endDate = formData.get('endDate') || '';
    const totalDays = formData.get('totalDays') || '0';
    const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' });
    const declared = formData.get('declaration') === 'on' ? 'Yes' : 'No';
    if (sheet._mock) {
      _mockLeaves.push({ empId: user.empId, type: formData.get('leaveType') || '', start: startDate, end: endDate, days: totalDays, reason: formData.get('reason') || '', status: 'Pending' });
      revalidatePath('/leave'); return { success: true };
    }
    await sheet.addRow({
      'Employee ID': user.empId, 'Timestamp': timestamp, 'Name': user.name,
      'Designation': formData.get('designation') || '', 'Leave Purpose': formData.get('leaveType') || '',
      'Department': formData.get('department') || '', 'Start Date': startDate, 'End Date': endDate,
      'Total Days': totalDays, 'Reason for leave': formData.get('reason') || '',
      'Contact Info during absence': formData.get('emergencyContact') || '',
      'Reporting Manager Name': formData.get('manager') || '',
      'Replacement Person': formData.get('replacementPerson') || '',
      'Declaration': declared,
      'Will you be available for any work related queries during my leave period?': formData.get('availability') || '',
      'Status': 'Pending', 'Approval': ''
    });
    revalidatePath('/leave'); return { success: true };
  } catch (err) { return { success: false, error: 'Server error. Please try again.' }; }
}

// ── Profile Actions ──

export async function getProfileData() {
  try {
    const user = await getSessionUser();
    if (!user) return null;
    const sheet = await getSheet('EmployeeDetails');
    if (sheet._mock) {
      return {
        fullName: user.name, email: user.email, empId: user.empId, designation: 'Senior Developer',
        contactNo: '9876543210', altContactNo: '', experienceLevel: 'Mid Level',
        address: '123 Mock Street, Apt 4B, Mumbai', dob: '1995-05-15', doj: '2022-01-10',
        idProof: 'PAN - ABCDE1234F', offerLetter: '', panCard: '', aadharCard: '', qualifications: '',
        joiningLetter: '', confirmationLetter: '', bankName: 'ICICI Bank', accountNo: '1234567890',
        ifscCode: 'ICIC0001234', branch: 'Mumbai Central', typeOfSaving: 'Savings', passbook: '',
        hasPrevExperience: false, prevCompany: '', prevStart: '', prevEnd: '', totalExp: '',
        prevDesignation: '', prevCtc: '', prevReason: '', hrName: '', hrContact: '', relievingLetter: 'No', expCertificate: 'No'
      };
    }
    const rows = await sheet.getRows();
    const matched = rows.find(r => (r.get('Email') || '').toLowerCase().trim() === user.email.toLowerCase().trim());
    if (!matched) return { fullName: user.name, email: user.email, empId: user.empId };
    return {
      fullName: matched.get('Full Name') || '', contactNo: matched.get('Contact Number') || '',
      altContactNo: matched.get('Contact Number') || '', email: matched.get('Email') || '',
      designation: matched.get('Designation') || '', experienceLevel: matched.get('Experience Level') || '',
      address: matched.get('Address') || '', dob: matched.get('Date of Birth') || '', doj: matched.get('Date of Joining') || '',
      idProof: matched.get('ID Proof No') || '', offerLetter: matched.get('Current Offer') || '',
      panCard: matched.get('PAN Card URI') || '', aadharCard: matched.get('Aadhar Card URI') || '',
      qualifications: matched.get('Other Docs URI') || '', joiningLetter: matched.get('Current Joining') || '',
      confirmationLetter: matched.get('Current Confirmation') || '', bankName: matched.get('Bank Name') || '',
      accountNo: matched.get('Account No') || '', ifscCode: matched.get('IFSC') || '',
      branch: matched.get('Branch') || '', typeOfSaving: matched.get('Type of Saving') || '',
      passbook: matched.get('Passbook upload') || '', hasPrevExperience: matched.get('Relieving Letter') === 'Yes',
      prevCompany: matched.get('Previous Company') || '', prevStart: matched.get('Start Date') || '',
      prevEnd: matched.get('End Date') || '', totalExp: matched.get('Total Experience') || '',
      prevDesignation: matched.get('Last Designation') || '', prevCtc: matched.get('Last CTC') || '',
      prevReason: matched.get('Reason for Leaving') || '', hrName: matched.get('HR Name') || '',
      hrContact: matched.get('HR Contact/Email') || '', relievingLetter: matched.get('Relieving Letter') || 'No', expCertificate: matched.get('Experience Letter') || 'No'
    };
  } catch (err) { return null; }
}

export async function getEmployeeDatabase() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'HR') return [];
    const sheet = await getSheet('EmployeeDetails');
    if (sheet._mock) {
      return [
        { empId: 'EMP101', fullName: 'Rahul Yadav', email: 'rahul@aura.com', designation: 'Engineering Manager', department: 'Engineering', contactNo: '9876543210', experienceLevel: 'Lead', doj: '2020-01-01' },
        { empId: 'EMP102', fullName: 'Krishna Pawar', email: 'pawarkrishna285@gmail.com', designation: 'Senior Developer', department: 'IT', contactNo: '9888888888', experienceLevel: 'Mid', doj: '2022-01-10' },
        { empId: 'EMP103', fullName: 'Madhavi Joshi', email: 'madhavi@aura.com', designation: 'Lead HR', department: 'HR', contactNo: '9777777777', experienceLevel: 'Lead', doj: '2021-03-15' },
      ];
    }
    const rows = await sheet.getRows();
    return rows.map(r => ({
      empId: r.get('Employee ID') || r.get('Client Id') || '', fullName: r.get('Full Name') || '', email: r.get('Email') || '',
      designation: r.get('Designation') || '', department: r.get('Department') || 'General', contactNo: r.get('Contact Number') || '',
      experienceLevel: r.get('Experience Level') || '', doj: r.get('Date of Joining') || '',
      // Documents
      panCard: r.get('PAN Card URI') || '', aadharCard: r.get('Aadhar Card URI') || '',
      offerLetter: r.get('Current Offer') || '', joiningLetter: r.get('Current Joining') || '',
      confirmationLetter: r.get('Current Confirmation') || '', qualifications: r.get('Other Docs URI') || '',
      passbook: r.get('Passbook upload') || '', relievingLetter: r.get('Upload: Relieving') || '',
      expCertificate: r.get('Upload: Exp Cert') || ''
    }));
  } catch (err) { return []; }
}

export async function saveProfileData(formData) {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: 'Session expired.' };
    const sheet = await getSheet('EmployeeDetails');
    const updates = {
      'Full Name': formData.get('fullName'), 'Contact Number': formData.get('contactNo'),
      'Personal Email': formData.get('email'), 'Email': formData.get('email'),
      'Designation': formData.get('designation'), 'Experience Level': formData.get('experienceLevel'),
      'Address': formData.get('address'), 'Date of Birth': formData.get('dob'), 'Date of Joining': formData.get('doj'),
      'ID Proof No': formData.get('idProof'), 'Current Offer': formData.get('offerLetter'),
      'PAN Card URI': formData.get('panCard'), 'Aadhar Card URI': formData.get('aadharCard'),
      'Other Docs URI': formData.get('qualifications'), 'Current Joining': formData.get('joiningLetter'),
      'Current Confirmation': formData.get('confirmationLetter'), 'Bank Name': formData.get('bankName'),
      'Account No': formData.get('accountNo'), 'IFSC': formData.get('ifscCode'),
      'Branch': formData.get('branch'), 'Type of Saving': formData.get('typeOfSaving'),
      'Passbook upload': formData.get('passbook'), 'Has Previous Experience': formData.get('hasPrevExperience') === 'on' ? 'Yes' : 'No',
      'Previous Company': formData.get('prevCompany'), 'Start Date': formData.get('prevStart'),
      'End Date': formData.get('prevEnd'), 'Total Experience': formData.get('totalExp'),
      'Last Designation': formData.get('prevDesignation'), 'Last CTC': formData.get('prevCtc'),
      'Reason for Leaving': formData.get('prevReason'), 'HR Name': formData.get('hrName'),
      'HR Contact/Email': formData.get('hrContact'), 'Relieving Letter': formData.get('relievingLetter'),
      'Experience Letter': formData.get('expCertificate'), 'Client Id': user.empId
    };
    if (sheet._mock) { revalidatePath('/profile'); return { success: true }; }
    const rows = await sheet.getRows();
    let targetRow = rows.find(r => (r.get('Email') || '').toLowerCase().trim() === user.email.toLowerCase().trim());
    if (targetRow) { targetRow.assign(updates); await targetRow.save(); }
    else { await sheet.addRow(updates); }
    revalidatePath('/profile'); return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function uploadProfileFile(formData) {
  try {
    const user = await getSessionUser(); if (!user) return { success: false, error: 'Session expired.' };
    const file = formData.get('file'); if (!file || !(file instanceof Blob)) return { success: false, error: 'Invalid file.' };
    const bytes = await file.arrayBuffer(); const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name) || '.pdf'; const timestamp = Date.now();
    const filename = `${user.empId}_${timestamp}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(path.join(uploadDir, filename), buffer);
    return { success: true, url: `/uploads/${filename}` };
  } catch (err) { return { success: false, error: err.message }; }
}

// ── Travel & Other Actions ──

export async function getTravelExpenses() {
  try {
    const sheet = await getSheet('Expense');
    if (sheet._mock) return [..._mockTravel].reverse();
    const rows = await sheet.getRows();
    return rows.map(row => {
      const data = row.toObject();
      return {
        id: data['Timestamp'] || Math.random().toString(), date: data['Timestamp']?.split(',')[0] || '-',
        name: data['Employee Name'] || '-', destination: data['Visit Location'] || '-',
        category: 'Daily', amount: data['Total Expenses'] || '-',
        status: data['Status'] || 'Pending', remarks: `Client: ${data['Client Name'] || '-'}`
      };
    }).reverse();
  } catch (err) { return [..._mockTravel].reverse(); }
}

export async function submitTravelExpense(data) {
  const sheet = await getSheet('Expense');
  const user = await getSessionUser();
  if (sheet._mock) {
    _mockTravel.push({
      id: Date.now().toString(), date: new Date().toISOString().split('T')[0],
      empId: user?.empId || 'MOCK-101', name: user?.name || 'User',
      destination: data.visitDetails?.visitLocation || '-', category: 'Daily',
      amount: data.totalExpenses || '0', status: 'Pending', remarks: data.visitDetails?.clientName
    });
    revalidatePath('/travel-expense'); return { success: true };
  }
  try {
    await sheet.addRow({
      'Timestamp': new Date().toLocaleString(), 'Employee Name': user?.name || '-',
      'Client Name': data.visitDetails?.clientName || '-', 'Visit Location': data.visitDetails?.visitLocation || '-',
      'Total Expenses': data.totalExpenses?.toString() || '0', 'Status': 'Pending'
    });
    revalidatePath('/travel-expense'); return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function getAdvanceSalaryRecords() {
  try {
    const sheet = await getSheet('Advance Salary');
    if (sheet._mock) return [..._mockAdvanceSalary].reverse();
    const rows = await sheet.getRows();
    return rows.map(r => {
      const data = r.toObject();
      return {
        id: data['Timestamp'] || Math.random().toString(), timestamp: data['Timestamp'] || '-',
        name: data['Employee Name'] || '-', empId: data['Employee ID'] || '-',
        department: data['Department'] || '-', amount: data['Amount Requested'] || '0',
        reason: data['Reason'] || '-', dateNeeded: data['Date Needed'] || '-',
        months: data['Repayment Months'] || '-', status: data['Status'] || 'Pending'
      };
    }).reverse();
  } catch (err) { return [..._mockAdvanceSalary].reverse(); }
}

export async function submitAdvanceSalaryRequest(data) {
  const sheet = await getSheet('Advance Salary');
  const user = await getSessionUser();
  const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' });
  const payload = {
    'Timestamp': timestamp, 'Employee Name': user?.name || 'Unknown', 'Employee ID': user?.empId || '-',
    'Department': data.department || '-', 'Amount Requested': data.amount?.toString() || '0',
    'Reason': data.reason || '-', 'Date Needed': data.dateNeeded || '-',
    'Repayment Months': data.months?.toString() || '1', 'Status': 'Pending'
  };
  if (sheet._mock) {
    _mockAdvanceSalary.push({ id: Date.now().toString(), ...payload, amount: payload['Amount Requested'] });
    revalidatePath('/advance-salary'); return { success: true };
  }
  try { await sheet.addRow(payload); revalidatePath('/advance-salary'); return { success: true }; }
  catch (err) { return { success: false, error: err.message }; }
}
