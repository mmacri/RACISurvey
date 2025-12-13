// data.js
// Sample data and lightweight persistence helpers for the Alignment Workshop Engine.
// Excel stays canonical, so controls are represented as row metadata with IDs referencing the original workbook rows.

const sampleFrameworks = [
  {
    id: 'nist-csf',
    name: 'NIST CSF 2.0',
    description: 'Cybersecurity governance and operational risk coverage.',
    readiness: 'green',
    controls: [
      { id: 'id-am-01', title: 'Asset Management Baseline', row: 12 },
      { id: 'pr-ac-03', title: 'Access Control Policy', row: 44 },
      { id: 'rs-rp-02', title: 'Incident Response Playbooks', row: 85 }
    ]
  },
  {
    id: 'nerc-cip',
    name: 'NERC CIP',
    description: 'Operational technology accountability for critical infrastructure.',
    readiness: 'yellow',
    controls: [
      { id: 'cip-004', title: 'Personnel & Training', row: 18 },
      { id: 'cip-007', title: 'Systems Security Management', row: 33 },
      { id: 'cip-010', title: 'Configuration Change Management', row: 62 }
    ]
  },
  {
    id: 'iso-27001',
    name: 'ISO 27001',
    description: 'Information security management system controls.',
    readiness: 'red',
    controls: [
      { id: 'a.5', title: 'Information Security Policies', row: 10 },
      { id: 'a.12', title: 'Operations Security', row: 48 },
      { id: 'a.17', title: 'Business Continuity', row: 90 }
    ]
  }
];

const sampleRoles = ['CIO', 'CISO', 'OT Director', 'Network Ops', 'Compliance', 'Finance', 'Legal'];

const sampleWorkshops = [
  {
    id: 'wk-nist-mar',
    name: 'NIST CSF Q1 Alignment',
    framework: 'NIST CSF 2.0',
    completion: 62,
    openGaps: 4,
    unassignedOwners: 2,
    readiness: 'yellow',
    mode: 'Live',
    lastAction: 'Scope locked for OT & Cloud'
  },
  {
    id: 'wk-nerc-apr',
    name: 'NERC CIP OT Hardening',
    framework: 'NERC CIP',
    completion: 81,
    openGaps: 2,
    unassignedOwners: 0,
    readiness: 'green',
    mode: 'Async Pre-Work',
    lastAction: 'Awaiting exec confirmation'
  },
  {
    id: 'wk-iso-may',
    name: 'ISO 27001 Readiness',
    framework: 'ISO 27001',
    completion: 38,
    openGaps: 7,
    unassignedOwners: 5,
    readiness: 'red',
    mode: 'Live',
    lastAction: 'Conflict review in progress'
  }
];

const sampleGaps = [
  {
    id: 'gap-1',
    control: 'Access Control Policy',
    type: 'No Accountable',
    risk: 'High',
    proposedOwner: 'CISO',
    targetState: 'Assign accountable and publish policy',
    status: 'Open'
  },
  {
    id: 'gap-2',
    control: 'Incident Response Playbooks',
    type: 'Low Confidence',
    risk: 'Medium',
    proposedOwner: 'OT Director',
    targetState: 'Validate OT runbooks',
    status: 'Open'
  }
];

const sampleDecisions = [
  { control: 'CIP-007', decision: 'Network Ops accountable', by: 'CIO', confidence: 80 },
  { control: 'ID.AM-01', decision: 'Dual owners rejected; CISO accountable', by: 'CISO', confidence: 92 },
];

const Storage = {
  load(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (err) {
      console.warn('Storage load failed', err);
      return fallback;
    }
  },
  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn('Storage save failed', err);
    }
  }
};
