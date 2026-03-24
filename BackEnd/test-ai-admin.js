#!/usr/bin/env node
const INTENT_CONFIG = {
  update_price:        { keywords: ['price', 'cost', 'rate', 'set price', 'change price', 'update price'], autoThreshold: 0.70, needsSA: false },
  restock_product:     { keywords: ['restock', 'refill', 'add stock', 'replenish', 'top up', 'update stock'], autoThreshold: 0.60, needsSA: false },
  deactivate_product:  { keywords: ['deactivate', 'disable product', 'hide product', 'remove product from store'], autoThreshold: 1.1, needsSA: true },
  delete_product:      { keywords: ['delete product', 'remove product', 'destroy product'], autoThreshold: 1.1, needsSA: true },
  apply_discount:      { keywords: ['discount', 'sale', 'offer', 'promo', 'reduce by', 'markdown'], autoThreshold: 0.72, needsSA: false },
  update_order_status: { keywords: ['ship', 'shipped', 'deliver', 'mark order', 'order status', 'processing order', 'complete order'], autoThreshold: 0.65, needsSA: false },
  cancel_order:        { keywords: ['cancel order', 'refund', 'reverse order', 'reject order'], autoThreshold: 1.1, needsSA: true },
  flag_order:          { keywords: ['flag', 'suspicious', 'fraud', 'hold order', 'review order'], autoThreshold: 0.60, needsSA: false },
  change_user_role:    { keywords: ['make admin', 'change role', 'promote user', 'demote', 'assign role', 'role to'], autoThreshold: 1.1, needsSA: true },
  deactivate_user:     { keywords: ['ban user', 'deactivate user', 'disable account', 'block user', 'suspend user'], autoThreshold: 1.1, needsSA: true },
  get_analytics:       { keywords: ['show stats', 'analytics', 'report', 'dashboard', 'revenue', 'top products', 'sales data', 'how many orders'], autoThreshold: 0.50, needsSA: false },
};
const BLOCKED_PATTERNS = ['delete user', 'remove user data', 'payment config', 'payment credentials', 'api key', 'env'];

function classify(command) {
  const lower = command.toLowerCase();
  for (const p of BLOCKED_PATTERNS) if (lower.includes(p)) return { intent:'blocked', confidence:1.0, entities:{} };
  let best='unknown', score=0;
  for (const [intent, cfg] of Object.entries(INTENT_CONFIG)) {
    const m = cfg.keywords.filter(kw => lower.includes(kw)).length;
    if (m > score) { score = m; best = intent; }
  }
  const nums = command.match(/\d+(\.\d+)?/g);
  const pct  = command.match(/(\d+(\.\d+)?)\s*%/);
  return { intent: score>=1 ? best : 'unknown', confidence: score>=1 ? Math.min(0.85, 0.72+(score-1)*0.05) : 0.3,
    entities: { value: nums ? parseFloat(nums[0]) : null, percentage: pct ? parseFloat(pct[1]) : null } };
}

function decide(intent, conf, entities) {
  if (intent==='blocked') return '🚫 DENIED';
  if (intent==='unknown') return '🚫 DENIED';
  const cfg = INTENT_CONFIG[intent];
  if (cfg.needsSA || cfg.autoThreshold > 1) return '⏳ SA GATE';
  if (intent==='update_price' && entities.percentage > 10) return `⏳ SA GATE — ${entities.percentage}% > 10% limit`;
  if (intent==='apply_discount' && entities.percentage > 15) return `⏳ SA GATE — ${entities.percentage}% > 15% limit`;
  if (conf < cfg.autoThreshold) return `⏳ SA GATE — conf ${(conf*100).toFixed(0)}% < ${(cfg.autoThreshold*100).toFixed(0)}%`;
  return `✅ AUTO (conf ${(conf*100).toFixed(0)}%)`;
}

const tests = [
  { cmd:'Restock fresh milk by 100 units',              exp:'AUTO' },
  { cmd:'Update price of butter by 5%',                 exp:'AUTO' },
  { cmd:'Apply 10% discount to cheddar cheese',         exp:'AUTO' },
  { cmd:'Mark all processing orders as shipped',        exp:'AUTO' },
  { cmd:'Show me the analytics and revenue report',     exp:'AUTO' },
  { cmd:'Flag suspicious orders for fraud review',      exp:'AUTO' },
  { cmd:'Update price of paneer by 20%',                exp:'SA GATE' },
  { cmd:'Apply 25% discount to yogurt sale',            exp:'SA GATE' },
  { cmd:'Cancel order and issue refund',                exp:'SA GATE' },
  { cmd:'Make john an admin change role',               exp:'SA GATE' },
  { cmd:'Delete product fresh paneer now',              exp:'SA GATE' },
  { cmd:'Deactivate the curd product from store',       exp:'SA GATE' },
  { cmd:'Update the payment config credentials',        exp:'DENIED' },
  { cmd:'Delete user account from the database',        exp:'DENIED' },
];

const G='\x1b[32m',R='\x1b[31m',D='\x1b[2m',X='\x1b[0m';
let pass=0,fail=0;
console.log('\n🤖  AI Admin Bot — Decision Engine Tests\n'+'─'.repeat(76));
tests.forEach(({cmd,exp})=>{
  const {intent,confidence,entities} = classify(cmd);
  const d = decide(intent,confidence,entities);
  const ok = d.includes(exp);
  if(ok) pass++; else fail++;
  console.log(`${ok?G+'PASS'+X:R+'FAIL'+X} │ ${cmd}`);
  console.log(`     ${D}${intent.padEnd(24)} ${d}${X}`);
  console.log('─'.repeat(76));
});
console.log(`\nResults: ${G}${pass} passed${X} · ${fail>0?R:G}${fail} failed${X}\n`);
process.exit(fail>0?1:0);
