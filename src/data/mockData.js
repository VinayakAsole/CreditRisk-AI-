export const kpiData = {
  totalPortfolio: { value: '₹2,847 Cr', change: '+4.2%', trend: 'up', label: 'Total Portfolio' },
  activeLoans: { value: '14,832', change: '-1.5%', trend: 'down', label: 'Active Loans' },
  defaultRate: { value: '3.2%', change: '+0.4%', trend: 'up', label: 'Default Rate' },
  pdAvgScore: { value: '0.156', change: '-0.02', trend: 'down', label: 'Avg PD Score' },
  npaRatio: { value: '1.8%', change: '-0.3%', trend: 'down', label: 'NPA Ratio' },
  recoveryRate: { value: '68.4%', change: '+5.1%', trend: 'up', label: 'Recovery Rate' },
};

export const riskBandData = {
  labels: ['Low', 'Moderate', 'High', 'Very High'],
  values: [45, 28, 18, 9],
  colors: ['#00FF88', '#FFD700', '#FF8C00', '#FF2D55'],
};

export const pdTrendData = {
  labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
  values: [0.18, 0.17, 0.19, 0.16, 0.21, 0.20, 0.18, 0.17, 0.15, 0.16, 0.15, 0.156],
};

export const recentAlerts = [
  { id: 'CR-9921', name: 'Amit Verma', pd: 0.85, band: 'Very High', dpd: 120, location: 'Mumbai', avatar: 'AV' },
  { id: 'CR-8812', name: 'Priya Nair', pd: 0.62, band: 'High', dpd: 85, location: 'Bangalore', avatar: 'PN' },
  { id: 'CR-7723', name: 'Rajesh Patil', pd: 0.91, band: 'Very High', dpd: 150, location: 'Pune', avatar: 'RP' },
  { id: 'CR-6634', name: 'Sunita Devi', pd: 0.55, band: 'High', dpd: 60, location: 'Delhi', avatar: 'SD' },
  { id: 'CR-5545', name: 'Mohammed Khan', pd: 0.78, band: 'Very High', dpd: 110, location: 'Hyderabad', avatar: 'MK' },
];

export const dataSourceHealth = [
  { name: 'Telecom', status: 'healthy', records: '2.4M', lastSync: '2 min ago', icon: '📡' },
  { name: 'Utility Bills', status: 'healthy', records: '1.8M', lastSync: '5 min ago', icon: '⚡' },
  { name: 'E-Commerce', status: 'healthy', records: '3.1M', lastSync: '1 min ago', icon: '🛒' },
  { name: 'Psychometric', status: 'warning', records: '0.4M', lastSync: '2 hrs ago', icon: '🧠' },
  { name: 'GST / Tax', status: 'healthy', records: '0.9M', lastSync: '10 min ago', icon: '📊' },
  { name: 'Social Graph', status: 'healthy', records: '5.2M', lastSync: '3 min ago', icon: '🕸️' },
];

export const defaulters = [
  { id: 'CR-9921', name: 'Amit Verma', pan: 'ABCPV1234F', phone: '9876543210', outstanding: '4,50,000', pd: 0.85, band: 'Very High', dpd: 120, lastContact: '12 Oct 2025', location: 'Mumbai', lat: 19.076, lng: 72.877, status: 'NPA', loanType: 'Personal Loan' },
  { id: 'CR-8812', name: 'Priya Nair', pan: 'XYZPN5678G', phone: '9812345678', outstanding: '2,10,000', pd: 0.62, band: 'High', dpd: 85, lastContact: '15 Oct 2025', location: 'Bangalore', lat: 12.971, lng: 77.594, status: 'Legal Notice', loanType: 'Business Loan' },
  { id: 'CR-7723', name: 'Rajesh Patil', pan: 'LMNOP9012H', phone: '9898765432', outstanding: '8,90,000', pd: 0.91, band: 'Very High', dpd: 150, lastContact: '10 Oct 2025', location: 'Pune', lat: 18.520, lng: 73.856, status: 'Written Off', loanType: 'Home Loan' },
  { id: 'CR-6634', name: 'Sunita Devi', pan: 'RSTUV3456I', phone: '9765432109', outstanding: '1,25,000', pd: 0.55, band: 'High', dpd: 60, lastContact: '18 Oct 2025', location: 'Delhi', lat: 28.613, lng: 77.209, status: 'Legal Notice', loanType: 'Gold Loan' },
  { id: 'CR-5545', name: 'Mohammed Khan', pan: 'GHIJK7890J', phone: '9654321098', outstanding: '3,40,000', pd: 0.78, band: 'Very High', dpd: 110, lastContact: '14 Oct 2025', location: 'Hyderabad', lat: 17.385, lng: 78.486, status: 'NPA', loanType: 'Vehicle Loan' },
  { id: 'CR-4456', name: 'Kavitha Reddy', pan: 'DEFGH1234K', phone: '9543210987', outstanding: '6,75,000', pd: 0.71, band: 'Very High', dpd: 95, lastContact: '08 Oct 2025', location: 'Chennai', lat: 13.082, lng: 80.270, status: 'NPA', loanType: 'Business Loan' },
  { id: 'CR-3367', name: 'Suresh Kumar', pan: 'MNOPQ5678L', phone: '9432109876', outstanding: '90,000', pd: 0.48, band: 'Moderate', dpd: 40, lastContact: '20 Oct 2025', location: 'Jaipur', lat: 26.912, lng: 75.787, status: 'DPD Warning', loanType: 'Personal Loan' },
];

// Full per-borrower contact timelines (mutable baseline – DefaulterSearch clones these into state)
export const defaulterTimelines = {
  'CR-9921': [
    { id: 't1', icon: '📞', type: 'Call', note: 'No response — 3rd attempt. Voicemail left.', date: '20 Oct 2025', agent: 'Ravi M.' },
    { id: 't2', icon: '📧', type: 'Email', note: 'Final demand notice sent to registered email.', date: '18 Oct 2025', agent: 'System' },
    { id: 't3', icon: '🏠', type: 'Field Visit', note: 'Address verified — occupant absent, neighbour confirmed residence.', date: '15 Oct 2025', agent: 'Field Agent A' },
    { id: 't4', icon: '📜', type: 'Legal Notice', note: 'Section 138 notice dispatched via registered post.', date: '10 Oct 2025', agent: 'Legal Dept.' },
    { id: 't5', icon: '📞', type: 'Call', note: 'First contact attempt — switched off.', date: '05 Oct 2025', agent: 'Ravi M.' },
  ],
  'CR-8812': [
    { id: 't1', icon: '📧', type: 'Email', note: 'Repayment schedule proposal emailed.', date: '15 Oct 2025', agent: 'System' },
    { id: 't2', icon: '📞', type: 'Call', note: 'Connected — borrower requests 30-day extension.', date: '10 Oct 2025', agent: 'Anjali S.' },
    { id: 't3', icon: '📜', type: 'Legal Notice', note: 'Demand notice under SARFAESI Act served.', date: '01 Oct 2025', agent: 'Legal Dept.' },
    { id: 't4', icon: '📞', type: 'Call', note: 'No response — 2nd attempt.', date: '25 Sep 2025', agent: 'Anjali S.' },
  ],
  'CR-7723': [
    { id: 't1', icon: '🏠', type: 'Field Visit', note: 'Property inspection conducted — asset sealed by bank.', date: '10 Oct 2025', agent: 'Field Agent B' },
    { id: 't2', icon: '📜', type: 'Legal Notice', note: 'Debt Recovery Tribunal (DRT) petition filed.', date: '01 Oct 2025', agent: 'Legal Dept.' },
    { id: 't3', icon: '📜', type: 'Legal Notice', note: 'Section 13(2) SARFAESI notice served.', date: '15 Sep 2025', agent: 'Legal Dept.' },
    { id: 't4', icon: '📧', type: 'Email', note: 'Written-off status notification sent.', date: '10 Sep 2025', agent: 'System' },
    { id: 't5', icon: '📞', type: 'Call', note: 'Call connected — borrower disputes outstanding amount.', date: '01 Sep 2025', agent: 'Ravi M.' },
  ],
  'CR-6634': [
    { id: 't1', icon: '📞', type: 'Call', note: 'Borrower agreed to partial repayment by month end.', date: '18 Oct 2025', agent: 'Anjali S.' },
    { id: 't2', icon: '📜', type: 'Legal Notice', note: 'Section 138 NI Act notice issued for bounced cheque.', date: '12 Oct 2025', agent: 'Legal Dept.' },
    { id: 't3', icon: '📧', type: 'Email', note: 'EMI overdue reminder — 2nd notice.', date: '05 Oct 2025', agent: 'System' },
    { id: 't4', icon: '📞', type: 'Call', note: 'Connected — requested extension of 15 days.', date: '28 Sep 2025', agent: 'Anjali S.' },
  ],
  'CR-5545': [
    { id: 't1', icon: '🏠', type: 'Field Visit', note: 'Vehicle inspection — asset found at borrower address.', date: '14 Oct 2025', agent: 'Field Agent C' },
    { id: 't2', icon: '📞', type: 'Call', note: 'No response — 4th attempt.', date: '10 Oct 2025', agent: 'Ravi M.' },
    { id: 't3', icon: '📜', type: 'Legal Notice', note: 'Repossession notice issued under Hire Purchase Act.', date: '03 Oct 2025', agent: 'Legal Dept.' },
    { id: 't4', icon: '📧', type: 'Email', note: 'Final demand — 7 days to cure default.', date: '25 Sep 2025', agent: 'System' },
  ],
  'CR-4456': [
    { id: 't1', icon: '📞', type: 'Call', note: 'Connected — borrower claims business cash-flow issues.', date: '08 Oct 2025', agent: 'Anjali S.' },
    { id: 't2', icon: '🏠', type: 'Field Visit', note: 'Business premises visited — operations appear suspended.', date: '04 Oct 2025', agent: 'Field Agent A' },
    { id: 't3', icon: '📜', type: 'Legal Notice', note: 'Notice u/s 13(2) SARFAESI for business collateral.', date: '27 Sep 2025', agent: 'Legal Dept.' },
    { id: 't4', icon: '📧', type: 'Email', note: 'Overdue EMI reminder — 3rd notice.', date: '20 Sep 2025', agent: 'System' },
  ],
  'CR-3367': [
    { id: 't1', icon: '📞', type: 'Call', note: 'Borrower connected — acknowledged overdue, promises payment.', date: '20 Oct 2025', agent: 'Anjali S.' },
    { id: 't2', icon: '📧', type: 'Email', note: 'DPD 30+ warning notification sent.', date: '15 Oct 2025', agent: 'System' },
    { id: 't3', icon: '📞', type: 'Call', note: '1st contact attempt — answered, call dropped.', date: '10 Oct 2025', agent: 'Ravi M.' },
  ],
};

export const networkNodes = [
  { id: 'AV', label: 'Amit Verma', pd: 0.85, x: 300, y: 200 },
  { id: 'PN', label: 'Priya Nair', pd: 0.62, x: 500, y: 150 },
  { id: 'RP', label: 'Rajesh Patil', pd: 0.91, x: 200, y: 350 },
  { id: 'SD', label: 'Sunita Devi', pd: 0.55, x: 450, y: 320 },
  { id: 'MK', label: 'Mohammed Khan', pd: 0.78, x: 600, y: 280 },
  { id: 'KR', label: 'Kavitha Reddy', pd: 0.71, x: 350, y: 420 },
  { id: 'SK', label: 'Suresh Kumar', pd: 0.48, x: 550, y: 430 },
  { id: 'CO1', label: 'Co-Applicant 1', pd: 0.35, x: 150, y: 180 },
  { id: 'CO2', label: 'Co-Applicant 2', pd: 0.29, x: 680, y: 180 },
];

export const networkEdges = [
  { source: 'AV', target: 'PN', weight: 0.8 },
  { source: 'AV', target: 'RP', weight: 0.9 },
  { source: 'PN', target: 'SD', weight: 0.6 },
  { source: 'MK', target: 'KR', weight: 0.7 },
  { source: 'RP', target: 'SD', weight: 0.5 },
  { source: 'KR', target: 'SK', weight: 0.4 },
  { source: 'AV', target: 'CO1', weight: 0.3 },
  { source: 'MK', target: 'CO2', weight: 0.3 },
  { source: 'PN', target: 'MK', weight: 0.6 },
];

export const shapFeatures = [
  { name: 'Telecom Regularity', value: +0.18, color: '#00FF88' },
  { name: 'Utility Payment History', value: +0.14, color: '#00FF88' },
  { name: 'Employment Stability', value: +0.12, color: '#00FF88' },
  { name: 'GST Filing Regularity', value: +0.09, color: '#00FF88' },
  { name: 'E-Commerce Spend Pattern', value: -0.11, color: '#FF2D55' },
  { name: 'DPD History (Bureau)', value: -0.16, color: '#FF2D55' },
  { name: 'BNPL Usage', value: -0.08, color: '#FF8C00' },
  { name: 'Loan-to-Income Ratio', value: -0.13, color: '#FF2D55' },
  { name: 'Geographic Mobility', value: +0.06, color: '#00FF88' },
  { name: 'Psychometric Score', value: +0.07, color: '#00FF88' },
];

export const psiData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  psi: [0.03, 0.04, 0.06, 0.08, 0.09],
  auroc: [0.82, 0.81, 0.80, 0.79, 0.78],
  ks: [0.42, 0.41, 0.40, 0.38, 0.37],
};

export const liveApplications = [
  { id: 'APP-00124', name: 'Ravi Sharma', amount: '₹2,50,000', pd: 0.12, band: 'Low', time: '2s ago' },
  { id: 'APP-00125', name: 'Deepika Joshi', amount: '₹5,00,000', pd: 0.67, band: 'High', time: '5s ago' },
  { id: 'APP-00126', name: 'Arjun Mehta', amount: '₹1,20,000', pd: 0.23, band: 'Low', time: '8s ago' },
  { id: 'APP-00127', name: 'Fatima Shaikh', amount: '₹8,00,000', pd: 0.88, band: 'Very High', time: '12s ago' },
  { id: 'APP-00128', name: 'Vikram Singh', amount: '₹3,75,000', pd: 0.45, band: 'Moderate', time: '15s ago' },
];

export const globeDefaulterPoints = [
  { lat: 40.7128, lng: -74.0060, city: 'New York', count: 245, intensity: 0.92 },
  { lat: 19.076, lng: 72.877, city: 'Mumbai', count: 234, intensity: 0.9 },
  { lat: 28.613, lng: 77.209, city: 'Delhi', count: 187, intensity: 0.8 },
  { lat: 51.5074, lng: -0.1278, city: 'London', count: 168, intensity: 0.75 },
  { lat: 12.971, lng: 77.594, city: 'Bangalore', count: 156, intensity: 0.7 },
  { lat: -23.5505, lng: -46.6333, city: 'São Paulo', count: 154, intensity: 0.72 },
  { lat: 13.082, lng: 80.270, city: 'Chennai', count: 143, intensity: 0.65 },
  { lat: 25.2048, lng: 55.2708, city: 'Dubai', count: 134, intensity: 0.62 },
  { lat: 17.385, lng: 78.486, city: 'Hyderabad', count: 128, intensity: 0.6 },
  { lat: 35.6762, lng: 139.6503, city: 'Tokyo', count: 115, intensity: 0.58 },
  { lat: 18.520, lng: 73.856, city: 'Pune', count: 112, intensity: 0.55 },
  { lat: 22.572, lng: 88.363, city: 'Kolkata', count: 98, intensity: 0.5 },
  { lat: 1.3521, lng: 103.8198, city: 'Singapore', count: 92, intensity: 0.48 },
  { lat: 23.022, lng: 72.571, city: 'Ahmedabad', count: 87, intensity: 0.45 },
  { lat: 50.1109, lng: 8.6821, city: 'Frankfurt', count: 85, intensity: 0.45 },
  { lat: -33.8688, lng: 151.2093, city: 'Sydney', count: 78, intensity: 0.42 },
  { lat: 26.912, lng: 75.787, city: 'Jaipur', count: 76, intensity: 0.4 },
  { lat: -33.9249, lng: 18.4241, city: 'Cape Town', count: 71, intensity: 0.39 },
  { lat: 21.145, lng: 79.088, city: 'Nagpur', count: 65, intensity: 0.35 },
  { lat: -1.2921, lng: 36.8219, city: 'Nairobi', count: 62, intensity: 0.35 }
];

export const aiAgentResponses = {
  default: "I'm your **CreditRisk AI Agent**. Ask me anything about portfolio health, specific borrowers, PD scores, or risk trends.",
  pd: "Based on the alternate data signals, the applicant's **Probability of Default is 0.34** — placing them in the **Moderate Risk** band. Key drivers: strong telecom regularity (+0.18) offset by high loan-to-income ratio (-0.13). Recommendation: **Conditional Approval** with a 2.5% risk premium.",
  defaulters: "Found **5 active defaulters** matching Very High Risk criteria. Top priority: **Rajesh Patil** (PD: 0.91, DPD: 150 days, ₹8.9L outstanding) in Pune — Written Off status. Recommend immediate legal escalation and asset recovery proceedings.",
  portfolio: "Portfolio health is **stable but trending upward on default risk**. Default rate increased 0.4% to 3.2% this month. The Psychometric data source has a warning — this may affect scoring accuracy for ~12% of applications. PSI is at 0.09, approaching the 0.10 threshold.",
  mumbai: "**Mumbai defaulter cluster** (234 accounts, ₹42Cr outstanding) shows strong social contagion — 68% of defaulters have shared co-applicants or guarantors. Network graph analysis reveals a central hub node linked to 12 NPA accounts. Recommend coordinated recovery action.",
  model: "Model performance is **tracking within acceptable bounds**: AUROC 0.78 (target ≥ 0.75), KS: 0.37, PSI: 0.09. Minor drift detected in E-Commerce feature distribution — monitoring monthly. Next champion-challenger cycle scheduled for June 15th.",
};
