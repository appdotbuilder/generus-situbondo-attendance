import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function seedUsers() {
  try {
    const existingGuru = await db.select().from(usersTable).where(eq(usersTable.username, 'guru0001')).execute();
    if (existingGuru.length === 0) {
      console.log('Seeding default guru user...');
      await db.insert(usersTable).values({
        username: 'guru0001',
        password: 'guru1234567890',
        role: 'guru',
        full_name: 'Guru Pengajar 0001',
        is_active: true
      }).execute();
    }

    const existingKoordinator = await db.select().from(usersTable).where(eq(usersTable.username, 'Ahmad Faqih Fajrin')).execute();
    if (existingKoordinator.length === 0) {
      console.log('Seeding default koordinator user...');
      await db.insert(usersTable).values({
        username: 'Ahmad Faqih Fajrin',
        password: 'Ahfin2615039798',
        role: 'koordinator',
        full_name: 'Ahmad Faqih Fajrin',
        is_active: true
      }).execute();
    }
    console.log('User seeding complete.');
  } catch (error) {
    console.error('Failed to seed default users:', error);
  }
}