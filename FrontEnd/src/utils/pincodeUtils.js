/**
 * Pincode Delivery Zone Utility
 *
 * India is divided into 5 delivery zones based on pincode prefix.
 * Standard delivery: normal speed, lower cost.
 * Express delivery:  next-day/2-day, higher cost.
 *
 * Pincode structure: [STD code zone][district][office]
 * First 2–3 digits broadly map to states/regions.
 */

// Zone definitions — name, description, standard & express charges (₹)
export const DELIVERY_ZONES = {
  LOCAL: {
    name: 'Local',
    description: 'Same city delivery',
    standardCharge: 30,
    expressCharge: 70,
    standardDays: '1–2 days',
    expressDays: 'Same day / Next day',
  },
  NEARBY: {
    name: 'Nearby',
    description: 'Within Tamil Nadu',
    standardCharge: 50,
    expressCharge: 110,
    standardDays: '2–3 days',
    expressDays: '1–2 days',
  },
  SOUTH: {
    name: 'South India',
    description: 'AP, Telangana, Karnataka, Kerala',
    standardCharge: 70,
    expressCharge: 150,
    standardDays: '3–4 days',
    expressDays: '1–2 days',
  },
  NATIONAL: {
    name: 'National',
    description: 'Rest of India',
    standardCharge: 100,
    expressCharge: 200,
    standardDays: '5–7 days',
    expressDays: '2–3 days',
  },
  REMOTE: {
    name: 'Remote',
    description: 'J&K, NE states, Andaman, Lakshadweep',
    standardCharge: 150,
    expressCharge: 300,
    standardDays: '7–10 days',
    expressDays: '3–5 days',
  },
};

// State prefix ranges → zone
// Indian pincodes: first digit = postal circle, first 2–3 = state/region
const PINCODE_ZONE_MAP = [
  // ── Tamil Nadu (LOCAL = Chennai 600xxx, NEARBY = rest of TN 6xxxxx) ──────
  { prefix: '600', zone: 'LOCAL' },   // Chennai city
  { prefix: '601', zone: 'LOCAL' },   // Chennai suburban
  { prefix: '602', zone: 'NEARBY' },
  { prefix: '603', zone: 'NEARBY' },
  { prefix: '604', zone: 'NEARBY' },
  { prefix: '605', zone: 'NEARBY' },  // Pondicherry area
  { prefix: '606', zone: 'NEARBY' },
  { prefix: '607', zone: 'NEARBY' },
  { prefix: '608', zone: 'NEARBY' },
  { prefix: '609', zone: 'NEARBY' },
  { prefix: '610', zone: 'NEARBY' },
  { prefix: '611', zone: 'NEARBY' },
  { prefix: '612', zone: 'NEARBY' },
  { prefix: '613', zone: 'NEARBY' },
  { prefix: '614', zone: 'NEARBY' },
  { prefix: '615', zone: 'NEARBY' },
  { prefix: '616', zone: 'NEARBY' },
  { prefix: '617', zone: 'NEARBY' },
  { prefix: '618', zone: 'NEARBY' },
  { prefix: '619', zone: 'NEARBY' },
  { prefix: '620', zone: 'NEARBY' },
  { prefix: '621', zone: 'NEARBY' },
  { prefix: '622', zone: 'NEARBY' },
  { prefix: '623', zone: 'NEARBY' },
  { prefix: '624', zone: 'NEARBY' },
  { prefix: '625', zone: 'NEARBY' },
  { prefix: '626', zone: 'NEARBY' },
  { prefix: '627', zone: 'NEARBY' },
  { prefix: '628', zone: 'NEARBY' },
  { prefix: '629', zone: 'NEARBY' },
  { prefix: '630', zone: 'NEARBY' },
  { prefix: '631', zone: 'NEARBY' },
  { prefix: '632', zone: 'NEARBY' },
  { prefix: '633', zone: 'NEARBY' },
  { prefix: '634', zone: 'NEARBY' },
  { prefix: '635', zone: 'NEARBY' },
  { prefix: '636', zone: 'NEARBY' },
  { prefix: '637', zone: 'NEARBY' },
  { prefix: '638', zone: 'NEARBY' },
  { prefix: '639', zone: 'NEARBY' },
  { prefix: '641', zone: 'NEARBY' },
  { prefix: '642', zone: 'NEARBY' },
  { prefix: '643', zone: 'NEARBY' },
  { prefix: '644', zone: 'NEARBY' },
  { prefix: '645', zone: 'NEARBY' },
  { prefix: '646', zone: 'NEARBY' },
  // ── Kerala ─────────────────────────────────────────────────────────────────
  { prefix: '67', zone: 'SOUTH' },
  { prefix: '68', zone: 'SOUTH' },
  { prefix: '69', zone: 'SOUTH' },
  // ── Karnataka ──────────────────────────────────────────────────────────────
  { prefix: '56', zone: 'SOUTH' },
  { prefix: '57', zone: 'SOUTH' },
  { prefix: '58', zone: 'SOUTH' },
  // ── Andhra Pradesh / Telangana ─────────────────────────────────────────────
  { prefix: '50', zone: 'SOUTH' },
  { prefix: '51', zone: 'SOUTH' },
  { prefix: '52', zone: 'SOUTH' },
  { prefix: '53', zone: 'SOUTH' },
  // ── Goa ────────────────────────────────────────────────────────────────────
  { prefix: '40', zone: 'SOUTH' },
  // ── Maharashtra ────────────────────────────────────────────────────────────
  { prefix: '41', zone: 'NATIONAL' },
  { prefix: '42', zone: 'NATIONAL' },
  { prefix: '43', zone: 'NATIONAL' },
  { prefix: '44', zone: 'NATIONAL' },
  // ── Gujarat ────────────────────────────────────────────────────────────────
  { prefix: '36', zone: 'NATIONAL' },
  { prefix: '37', zone: 'NATIONAL' },
  { prefix: '38', zone: 'NATIONAL' },
  { prefix: '39', zone: 'NATIONAL' },
  // ── Rajasthan ──────────────────────────────────────────────────────────────
  { prefix: '30', zone: 'NATIONAL' },
  { prefix: '31', zone: 'NATIONAL' },
  { prefix: '32', zone: 'NATIONAL' },
  { prefix: '33', zone: 'NATIONAL' },
  { prefix: '34', zone: 'NATIONAL' },
  // ── Delhi / NCR ────────────────────────────────────────────────────────────
  { prefix: '11', zone: 'NATIONAL' },
  // ── UP ─────────────────────────────────────────────────────────────────────
  { prefix: '20', zone: 'NATIONAL' },
  { prefix: '21', zone: 'NATIONAL' },
  { prefix: '22', zone: 'NATIONAL' },
  { prefix: '23', zone: 'NATIONAL' },
  { prefix: '24', zone: 'NATIONAL' },
  { prefix: '25', zone: 'NATIONAL' },
  { prefix: '26', zone: 'NATIONAL' },
  { prefix: '27', zone: 'NATIONAL' },
  { prefix: '28', zone: 'NATIONAL' },
  // ── Bihar / Jharkhand ──────────────────────────────────────────────────────
  { prefix: '80', zone: 'NATIONAL' },
  { prefix: '81', zone: 'NATIONAL' },
  { prefix: '82', zone: 'NATIONAL' },
  { prefix: '83', zone: 'NATIONAL' },
  { prefix: '84', zone: 'NATIONAL' },
  { prefix: '85', zone: 'NATIONAL' },
  // ── West Bengal / Odisha ───────────────────────────────────────────────────
  { prefix: '70', zone: 'NATIONAL' },
  { prefix: '71', zone: 'NATIONAL' },
  { prefix: '72', zone: 'NATIONAL' },
  { prefix: '73', zone: 'NATIONAL' },
  { prefix: '74', zone: 'NATIONAL' },
  { prefix: '75', zone: 'NATIONAL' },
  { prefix: '76', zone: 'NATIONAL' },
  { prefix: '77', zone: 'NATIONAL' },
  // ── MP / Chhattisgarh ──────────────────────────────────────────────────────
  { prefix: '46', zone: 'NATIONAL' },
  { prefix: '47', zone: 'NATIONAL' },
  { prefix: '48', zone: 'NATIONAL' },
  { prefix: '49', zone: 'NATIONAL' },
  // ── Punjab / Haryana / HP ──────────────────────────────────────────────────
  { prefix: '14', zone: 'NATIONAL' },
  { prefix: '15', zone: 'NATIONAL' },
  { prefix: '16', zone: 'NATIONAL' },
  { prefix: '17', zone: 'NATIONAL' },
  // ── Uttarakhand ────────────────────────────────────────────────────────────
  { prefix: '24', zone: 'NATIONAL' },
  // ── Assam / NE states ──────────────────────────────────────────────────────
  { prefix: '78', zone: 'REMOTE' },
  { prefix: '79', zone: 'REMOTE' },
  // ── J&K ────────────────────────────────────────────────────────────────────
  { prefix: '18', zone: 'REMOTE' },
  { prefix: '19', zone: 'REMOTE' },
  // ── Andaman & Nicobar ──────────────────────────────────────────────────────
  { prefix: '744', zone: 'REMOTE' },
  // ── Lakshadweep ────────────────────────────────────────────────────────────
  { prefix: '682', zone: 'REMOTE' },
];

/**
 * Look up delivery zone from a 6-digit Indian pincode.
 * Returns the zone key ('LOCAL', 'NEARBY', etc.) or null if invalid.
 */
export function getZoneFromPincode(pincode) {
  const pin = String(pincode).trim();
  if (!/^\d{6}$/.test(pin)) return null;

  // Check longest prefix first (3-digit), then 2-digit
  for (let len = 3; len >= 2; len--) {
    const prefix = pin.slice(0, len);
    const match = PINCODE_ZONE_MAP.find(m => m.prefix === prefix);
    if (match) return match.zone;
  }

  // Fallback: first digit broad mapping
  const firstDigit = pin[0];
  const fallbackMap = {
    '1': 'NATIONAL', // Delhi / Haryana / Punjab area
    '2': 'NATIONAL', // UP / Uttarakhand
    '3': 'NATIONAL', // Rajasthan / Gujarat partial
    '4': 'NATIONAL', // Maharashtra / Goa / Gujarat
    '5': 'SOUTH',    // AP / Telangana / Karnataka
    '6': 'NEARBY',   // TN / Kerala / Puducherry
    '7': 'NATIONAL', // WB / Odisha / NE
    '8': 'NATIONAL', // Bihar / Jharkhand / Odisha
    '9': 'NATIONAL', // catch-all
  };
  return fallbackMap[firstDigit] || 'NATIONAL';
}

/**
 * Returns full delivery info for a pincode.
 * {
 *   valid: bool,
 *   zone: 'LOCAL' | 'NEARBY' | 'SOUTH' | 'NATIONAL' | 'REMOTE',
 *   zoneName: string,
 *   zoneDescription: string,
 *   standard: { charge, days },
 *   express: { charge, days }
 * }
 */
export function getDeliveryInfo(pincode) {
  const zoneKey = getZoneFromPincode(pincode);
  if (!zoneKey) return { valid: false };

  const zone = DELIVERY_ZONES[zoneKey];
  return {
    valid: true,
    zone: zoneKey,
    zoneName: zone.name,
    zoneDescription: zone.description,
    standard: { charge: zone.standardCharge, days: zone.standardDays },
    express:  { charge: zone.expressCharge,  days: zone.expressDays  },
  };
}
