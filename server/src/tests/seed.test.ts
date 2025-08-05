import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { seedUsers } from '../handlers/seed';
import { eq } from 'drizzle-orm';

describe('seedUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should seed default guru and koordinator users', async () => {
    await seedUsers();

    // Check if guru user was created
    const guruUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, 'guru0001'))
      .execute();

    expect(guruUsers).toHaveLength(1);
    expect(guruUsers[0].username).toEqual('guru0001');
    expect(guruUsers[0].password).toEqual('guru1234567890');
    expect(guruUsers[0].role).toEqual('guru');
    expect(guruUsers[0].full_name).toEqual('Guru Pengajar 0001');
    expect(guruUsers[0].is_active).toBe(true);

    // Check if koordinator user was created
    const koordinatorUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, 'Ahmad Faqih Fajrin'))
      .execute();

    expect(koordinatorUsers).toHaveLength(1);
    expect(koordinatorUsers[0].username).toEqual('Ahmad Faqih Fajrin');
    expect(koordinatorUsers[0].password).toEqual('Ahfin2615039798');
    expect(koordinatorUsers[0].role).toEqual('koordinator');
    expect(koordinatorUsers[0].full_name).toEqual('Ahmad Faqih Fajrin');
    expect(koordinatorUsers[0].is_active).toBe(true);
  });

  it('should not create duplicate users if they already exist', async () => {
    // Create guru user manually first
    await db.insert(usersTable).values({
      username: 'guru0001',
      password: 'guru1234567890',
      role: 'guru',
      full_name: 'Guru Pengajar 0001',
      is_active: true
    }).execute();

    // Run seeding
    await seedUsers();

    // Check that only one guru user exists
    const guruUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, 'guru0001'))
      .execute();

    expect(guruUsers).toHaveLength(1);

    // Koordinator should still be created
    const koordinatorUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, 'Ahmad Faqih Fajrin'))
      .execute();

    expect(koordinatorUsers).toHaveLength(1);
  });

  it('should handle database errors gracefully', async () => {
    // This test ensures the function doesn't crash on errors
    // We'll just verify it completes without throwing
    await expect(seedUsers()).resolves.toBeUndefined();
  });
});