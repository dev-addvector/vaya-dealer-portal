const mysql = require('mysql2/promise');
const { MongoClient, ObjectId } = require('mongodb');

const MYSQL = { host: 'localhost', user: 'root', password: '', database: 'vaya' };
const MONGO_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/vaya';

async function main() {
  const sql = await mysql.createConnection(MYSQL);
  const mongo = new MongoClient(MONGO_URL);
  await mongo.connect();
  const db = mongo.db();
  console.log('Connected to MySQL and MongoDB\n');

  // ── 1. Users ───────────────────────────────────────────────────────────────
  const [users] = await sql.query('SELECT * FROM users');
  const userIdMap = {}; // MySQL bigint id → MongoDB ObjectId

  if (users.length) {
    const docs = users.map((u) => {
      const _id = new ObjectId();
      userIdMap[u.id] = _id;
      return {
        _id,
        name: u.name || null,
        email: u.email,
        accountingEmail: u.accounting_email || null,
        authorizationPassword: u.authorization_password || null,
        password: u.password,
        unc: u.unc || null,
        keyParse: u.key_parse || null,
        isStatus: u.is_status ?? 1,
        zone: u.zone || null,
        cutDiscount: u.cut_discount || null,
        rollDiscount: u.roll_discount || null,
        role: u.role || 'user',
        createdAt: u.created_at || new Date(),
        updatedAt: u.updated_at || new Date(),
      };
    });
    await db.collection('users').insertMany(docs);
  }
  console.log(`✓ Users:                 ${users.length}`);

  // ── 2. Settings ────────────────────────────────────────────────────────────
  const [settings] = await sql.query('SELECT * FROM settings');
  if (settings.length) {
    await db.collection('settings').insertMany(settings.map((s) => ({
      smtp_email: s.smtp_email || null,
      smtp_pass: s.smtp_pass || null,
      image: s.image || null,
      receiving_order_days: s.receiving_order_days || null,
      ebrochure: s.ebrochure || null,
      gst: s.gst || null,
      qr_link: s.qr_link || null,
      createdAt: s.created_at || new Date(),
      updatedAt: s.updated_at || new Date(),
    })));
  }
  console.log(`✓ Settings:              ${settings.length}`);

  // ── 3. Cart items (userId FK) ──────────────────────────────────────────────
  const [cartItems] = await sql.query('SELECT * FROM cart_items');
  const mappedCart = cartItems
    .filter((item) => userIdMap[item.userId])
    .map((item) => ({
      userId: userIdMap[item.userId],
      productId: item.productId || String(item.id),
      productName: item.productName || null,
      pattern: item.pattern || null,
      color: item.color || null,
      price: item.price != null ? parseFloat(item.price) : null,
      rollPrice: item.roll_price != null ? parseFloat(item.roll_price) : null,
      cutPrice: item.cut_price != null ? parseFloat(item.cut_price) : null,
      gstPercent: item.gst_percent != null ? parseFloat(item.gst_percent) : null,
      quantity: item.quantity != null ? parseFloat(item.quantity) : 1,
      unit: item.unit || null,
      remark: item.remark || null,
      createdAt: item.created_at || new Date(),
      updatedAt: item.updated_at || new Date(),
    }));
  if (mappedCart.length) await db.collection('cart_items').insertMany(mappedCart);
  console.log(`✓ Cart items:            ${mappedCart.length}`);

  // ── 4. Password reset tokens (userId FK) ──────────────────────────────────
  const [tokens] = await sql.query('SELECT * FROM password_reset_tokens');
  const mappedTokens = tokens
    .filter((t) => userIdMap[t.userId])
    .map((t) => ({
      userId: userIdMap[t.userId],
      token: t.token,
      expiresAt: t.expiresAt || new Date(),
      createdAt: t.created_at || new Date(),
      updatedAt: new Date(),
    }));
  if (mappedTokens.length) await db.collection('password_reset_tokens').insertMany(mappedTokens);
  console.log(`✓ Password reset tokens: ${mappedTokens.length}`);

  // ── 5. User contacts (userId FK) ──────────────────────────────────────────
  const [contacts] = await sql.query('SELECT * FROM user_contacts');
  const mappedContacts = contacts
    .filter((c) => userIdMap[c.userId])
    .map((c) => ({
      userId: userIdMap[c.userId],
      name: c.name || null,
      phone: c.phone || null,
      email: c.email || null,
      isDefault: c.isDefault ?? 0,
      createdAt: c.created_at || new Date(),
      updatedAt: c.updated_at || new Date(),
    }));
  if (mappedContacts.length) await db.collection('user_contacts').insertMany(mappedContacts);
  console.log(`✓ User contacts:         ${mappedContacts.length}`);

  // ── 6. Ads ─────────────────────────────────────────────────────────────────
  const [ads] = await sql.query('SELECT * FROM ads');
  if (ads.length) {
    await db.collection('ads').insertMany(ads.map((a) => ({
      title: a.title || null,
      startDate: a.start_date || null,
      endDate: a.end_date || null,
      createdAt: a.created_at || new Date(),
      updatedAt: a.updated_at || new Date(),
    })));
  }
  console.log(`✓ Ads:                   ${ads.length}`);

  // ── 7. Brochures ───────────────────────────────────────────────────────────
  const [brochures] = await sql.query('SELECT * FROM brochure');
  if (brochures.length) {
    await db.collection('brochures').insertMany(brochures.map((b) => ({
      title: b.title || null,
      brochure_key: b.brochure_key || null,
      file_name: b.file_name || null,
      qr_code: b.qr_code || null,
      qr_code2: b.qr_code2 || null,
      pattern_name: b.pattern_name || null,
      is_active: b.is_active == null ? true : !!b.is_active,
      created_at: b.created_at || new Date(),
      updated_at: b.updated_at || new Date(),
    })));
  }
  console.log(`✓ Brochures:             ${brochures.length}`);

  // ── 8. Ebrochure files ─────────────────────────────────────────────────────
  const [ebrochures] = await sql.query('SELECT * FROM multiple_ebrochure_file');
  if (ebrochures.length) {
    await db.collection('ebrochure_files').insertMany(ebrochures.map((e) => ({
      ebrochure: e.ebrochure || null,
      createdAt: e.created_at || new Date(),
      updatedAt: e.updated_at || new Date(),
    })));
  }
  console.log(`✓ Ebrochure files:       ${ebrochures.length}`);

  // ── 9. Search reports ──────────────────────────────────────────────────────
  const [reports] = await sql.query('SELECT * FROM search_report');
  if (reports.length) {
    await db.collection('search_reports').insertMany(reports.map((r) => ({
      search_string: r.search_string || null,
      pattern: r.pattern || null,
      color: r.color || null,
      consignee_name: r.consignee_name || null,
      location: r.location || null,
      elpsed_time: r.elpsed_time || null,
      row_count: r.row_count ?? 0,
      device_type: r.device_type || null,
      os_type: r.os_type || null,
      user_agent: r.user_agent || null,
      timestamp: r.timestamp || new Date(),
      created_at: r.created_at || new Date(),
      updated_at: r.updated_at || new Date(),
    })));
  }
  console.log(`✓ Search reports:        ${reports.length}`);

  await sql.end();
  await mongo.close();
  console.log('\nMigration complete ✓');
}

main().catch((e) => { console.error('\nMigration failed:', e.message); process.exit(1); });
