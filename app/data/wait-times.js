// wait-times.js — Treatment wait time snapshots
// Each entry is the most recent coordinator report for a facility.
// In production these would be server-stored; here they are seeded mock data
// that the reporting form updates in sessionStorage.

// Base date: April 11 2026
const WT_BASE = new Date('2026-04-11').getTime();
const daysAgo = d => new Date(WT_BASE - d * 86400000).toISOString().slice(0, 10);

const WAIT_SNAPSHOTS = {
  // PHSA bed-based
  "bcmhsus-burnaby": {
    waitDays: 42,
    bedsAvail: 3,
    totalBeds: 80,
    expectedDischarges: 2,
    reportedAt: daysAgo(3),
    reporterName: "Sarah Chen",
    notes: "Priority track available for complex concurrent disorder clients with housing instability."
  },
  "heartwood": {
    waitDays: 56,
    bedsAvail: 0,
    totalBeds: 24,
    expectedDischarges: 1,
    reportedAt: daysAgo(1),
    reporterName: "Maria Santos",
    notes: "No beds available. Intake assessments paused until May cohort."
  },
  "redfish": {
    waitDays: 35,
    bedsAvail: 8,
    totalBeds: 105,
    expectedDischarges: 4,
    reportedAt: daysAgo(2),
    reporterName: "David Park",
    notes: "New admissions open. OAT continuation guaranteed on admission."
  },

  // VCH bed-based
  "harbour-light": {
    waitDays: 14,
    bedsAvail: 2,
    totalBeds: 12,
    expectedDischarges: 2,
    reportedAt: daysAgo(0),
    reporterName: "Angela Thompson",
    notes: "Two beds opening mid-week. Priority for women exiting emergency shelter."
  },
  "turning-point-richmond": {
    waitDays: 21,
    bedsAvail: 4,
    totalBeds: 28,
    expectedDischarges: 3,
    reportedAt: daysAgo(5),
    reporterName: "Kevin McAllister",
    notes: "Short-term (28-day) and long-term (90-day) streams — specify at referral."
  },
  "turning-point-nv": {
    waitDays: 28,
    bedsAvail: 1,
    totalBeds: 20,
    expectedDischarges: 2,
    reportedAt: daysAgo(8),
    reporterName: "Lisa Bergeron",
    notes: null
  },
  "last-door": {
    waitDays: 10,
    bedsAvail: 5,
    totalBeds: 35,
    expectedDischarges: 4,
    reportedAt: daysAgo(4),
    reporterName: "James Kowalski",
    notes: "Govt-funded beds filling fast — confirm eligibility before referral."
  },
  "john-volken": {
    waitDays: 60,
    bedsAvail: 0,
    totalBeds: 40,
    expectedDischarges: 2,
    reportedAt: daysAgo(12),
    reporterName: "Patricia Ndou",
    notes: "Waitlist active. Next intake expected early June."
  },

  // FH bed-based
  "mrtc": {
    waitDays: 18,
    bedsAvail: 6,
    totalBeds: 30,
    expectedDischarges: 5,
    reportedAt: daysAgo(1),
    reporterName: "Robert Chen",
    notes: "Two 4-week cohorts and one 7-week cohort running. Referral via RCS fax only."
  },
  "peardonville": {
    waitDays: 30,
    bedsAvail: 2,
    totalBeds: 22,
    expectedDischarges: 2,
    reportedAt: daysAgo(6),
    reporterName: "Helen MacPherson",
    notes: "Children's room available. Notify at referral if client has children under 5."
  },
  "kinghaven": {
    waitDays: 45,
    bedsAvail: 0,
    totalBeds: 32,
    expectedDischarges: 3,
    reportedAt: daysAgo(2),
    reporterName: "Bill Morrison",
    notes: "Farm program running at capacity. Add to waitlist via RCS."
  },
  "ellendale": {
    waitDays: 22,
    bedsAvail: 3,
    totalBeds: 18,
    expectedDischarges: 2,
    reportedAt: daysAgo(9),
    reporterName: "Tamara Singh",
    notes: null
  },
  "innervisions-men": {
    waitDays: 14,
    bedsAvail: 4,
    totalBeds: 24,
    expectedDischarges: 3,
    reportedAt: daysAgo(3),
    reporterName: "Craig Doherty",
    notes: "60-day program. Second-stage housing available post-program."
  },
  "hannah-house": {
    waitDays: 7,
    bedsAvail: 5,
    totalBeds: 20,
    expectedDischarges: 3,
    reportedAt: daysAgo(1),
    reporterName: "Rachel Flynn",
    notes: "Good availability this week. OAT-friendly intake."
  },
  "stlr": {
    waitDays: 3,
    bedsAvail: 12,
    totalBeds: null,
    expectedDischarges: null,
    reportedAt: daysAgo(4),
    reporterName: "FH MHSU Access",
    notes: "Distributed across multiple FH sites. Bed count varies by site. Call for nearest available."
  },
  "star-beds": {
    waitDays: 1,
    bedsAvail: 8,
    totalBeds: null,
    expectedDischarges: null,
    reportedAt: daysAgo(2),
    reporterName: "FH Access Line",
    notes: "For post-acute detox only. Clinically supported short stay (up to 14 days)."
  },

  // VCH outpatient
  "core": {
    waitDays: 10,
    bedsAvail: null,
    totalBeds: null,
    expectedDischarges: null,
    reportedAt: daysAgo(5),
    reporterName: "Maya Johnson",
    notes: "Groundwork stream: ~2 wk wait. Evolution (trauma) stream: closed to new intakes until June."
  },
  "vamp": {
    waitDays: 18,
    bedsAvail: null,
    totalBeds: null,
    expectedDischarges: null,
    reportedAt: daysAgo(7),
    reporterName: "Theo Christodoulou",
    notes: "Next cohort starts May 4. All-gender and queer men streams available."
  },
  "women-outpatient": {
    waitDays: 14,
    bedsAvail: null,
    totalBeds: null,
    expectedDischarges: null,
    reportedAt: daysAgo(14),
    reporterName: "Priya Nair",
    notes: null
  },
  "youth-day-tx": {
    waitDays: 7,
    bedsAvail: null,
    totalBeds: null,
    expectedDischarges: null,
    reportedAt: daysAgo(3),
    reporterName: "Sofia Reyes",
    notes: "New 15-week module starting April 28. Referrals accepted now."
  },
  "su-counselling-vch": {
    waitDays: 5,
    bedsAvail: null,
    totalBeds: null,
    expectedDischarges: null,
    reportedAt: daysAgo(10),
    reporterName: "VCH Access",
    notes: "Wait varies by CHC location. Strathcona and Raven Song typically shortest."
  },

  // FH outpatient
  "dew": {
    waitDays: 7,
    bedsAvail: null,
    totalBeds: null,
    expectedDischarges: null,
    reportedAt: daysAgo(4),
    reporterName: "Sam Ouellette",
    notes: "Virtual option available immediately. In-person Surrey slots filling for May."
  },
  "creekside-daytox": {
    waitDays: 2,
    bedsAvail: null,
    totalBeds: null,
    expectedDischarges: null,
    reportedAt: daysAgo(1),
    reporterName: "Nina Petrov",
    notes: "Immediate access for post-acute withdrawal. Referral from RCS or acute care."
  },
  "riverstone": {
    waitDays: 3,
    bedsAvail: null,
    totalBeds: null,
    expectedDischarges: null,
    reportedAt: daysAgo(6),
    reporterName: "Amy Laurendeau",
    notes: "Home-based detox — no wait for most areas. Support team visits 2–3×/day."
  },
  "raac-fh": {
    waitDays: 1,
    bedsAvail: null,
    totalBeds: null,
    expectedDischarges: null,
    reportedAt: daysAgo(2),
    reporterName: "RAAC Access Line",
    notes: "Walk-in same day at Surrey and New Westminster sites most weekdays."
  },
  "fh-su-counselling": {
    waitDays: 10,
    bedsAvail: null,
    totalBeds: null,
    expectedDischarges: null,
    reportedAt: daysAgo(11),
    reporterName: "FH MHSU Access",
    notes: null
  },
  "abbotsford-addictions": {
    waitDays: 5,
    bedsAvail: null,
    totalBeds: null,
    expectedDischarges: null,
    reportedAt: daysAgo(4),
    reporterName: "Ben Tran",
    notes: "Youth and adult streams available. Multicultural programming offered."
  },
};

// Merge sessionStorage overrides (from coordinator reporting form)
(function applyLocalOverrides() {
  try {
    const saved = JSON.parse(sessionStorage.getItem('wt_overrides') || '{}');
    Object.assign(WAIT_SNAPSHOTS, saved);
  } catch(e) {}
})();
