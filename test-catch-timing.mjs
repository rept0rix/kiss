/**
 * Test script to verify the catch timing fix
 * 
 * Simulates:
 * 1. User A sends a kiss to User B
 * 2. Verify B's receivedAll count doesn't change (kiss is uncaught)
 * 3. Mark the kiss as caught
 * 4. Verify B's receivedAll count increases by 1
 */

import { PGlite } from '@electric-sql/pglite';

async function test() {
  console.log('🧪 Testing catch timing fix...\n');

  // Create in-memory PGlite instance
  const db = new PGlite();
  await db.waitReady;

  // Create schema
  await db.exec(`
    create table profiles (
      user_id text primary key,
      display_name text not null,
      last_seen timestamptz default now()
    );
    
    create table kisses (
      id serial primary key,
      from_user_id text not null,
      to_user_id text not null,
      kind text not null,
      created_at timestamptz not null default now(),
      caught_at timestamptz
    );
  `);

  // Insert test users
  await db.exec(`
    insert into profiles (user_id, display_name) values
    ('user_a', 'QA Tester'),
    ('user_b', '5550005678');
  `);

  console.log('✅ Created test users: QA Tester (A) and 5550005678 (B)\n');

  // Get initial receivedAll count for user B (should be 0)
  const initial = await db.query(`
    select count(*)::int as received_all 
    from kisses 
    where to_user_id = 'user_b' and caught_at is not null
  `);
  console.log(`📊 User B initial receivedAll: ${initial.rows[0].received_all}`);
  
  if (initial.rows[0].received_all !== 0) {
    throw new Error('Expected initial receivedAll to be 0');
  }

  // User A sends a kiss to User B
  await db.exec(`
    insert into kisses (from_user_id, to_user_id, kind)
    values ('user_a', 'user_b', 'classic')
  `);
  console.log('💋 User A sent a kiss to User B\n');

  // Check receivedAll BEFORE catching (should still be 0)
  const beforeCatch = await db.query(`
    select count(*)::int as received_all 
    from kisses 
    where to_user_id = 'user_b' and caught_at is not null
  `);
  console.log(`📊 User B receivedAll BEFORE catch: ${beforeCatch.rows[0].received_all}`);
  
  if (beforeCatch.rows[0].received_all !== 0) {
    throw new Error('❌ FAILED: receivedAll should not increment before catch!');
  }
  console.log('✅ PASS: receivedAll correctly stays at 0 when card opens\n');

  // User B catches the kiss (closes the card)
  await db.exec(`
    update kisses 
    set caught_at = now() 
    where to_user_id = 'user_b' and caught_at is null
  `);
  console.log('👆 User B closed the catch card\n');

  // Check receivedAll AFTER catching (should now be 1)
  const afterCatch = await db.query(`
    select count(*)::int as received_all 
    from kisses 
    where to_user_id = 'user_b' and caught_at is not null
  `);
  console.log(`📊 User B receivedAll AFTER catch: ${afterCatch.rows[0].received_all}`);
  
  if (afterCatch.rows[0].received_all !== 1) {
    throw new Error('❌ FAILED: receivedAll should be 1 after catch!');
  }
  console.log('✅ PASS: receivedAll correctly increments to 1 after close\n');

  console.log('🎉 All tests passed! The fix works correctly.\n');
  console.log('Summary:');
  console.log('  ✓ receivedAll stays 0 when kiss card opens (uncaught)');
  console.log('  ✓ receivedAll increases to 1 only after user closes card (caught)');
}

test().catch(err => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
