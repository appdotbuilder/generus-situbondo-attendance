
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { login, getCurrentUser } from '../handlers/auth';
import { eq } from 'drizzle-orm';

// Test users data
const testGuru = {
  username: 'guru0001',
  password: 'guru1234567890',
  role: 'guru' as const,
  full_name: 'Test Guru 1',
  is_active: true
};

const testKoordinator = {
  username: 'Ahmad Faqih Fajrin',
  password: 'Ahfin2615039798',
  role: 'koordinator' as const,
  full_name: 'Ahmad Faqih Fajrin',
  is_active: true
};

const inactiveUser = {
  username: 'guru0002',
  password: 'guru1234567890',
  role: 'guru' as const,
  full_name: 'Inactive Guru',
  is_active: false
};

describe('auth handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('login', () => {
    beforeEach(async () => {
      // Insert test users
      await db.insert(usersTable).values([testGuru, testKoordinator, inactiveUser]).execute();
    });

    it('should login guru with valid credentials', async () => {
      const loginInput: LoginInput = {
        username: 'guru0001',
        password: 'guru1234567890',
        role: 'guru'
      };

      const result = await login(loginInput);

      expect(result).toBeDefined();
      expect(result!.username).toEqual('guru0001');
      expect(result!.role).toEqual('guru');
      expect(result!.full_name).toEqual('Test Guru 1');
      expect(result!.is_active).toEqual(true);
      expect(result!.password).toEqual(''); // Password should not be returned
      expect(result!.id).toBeDefined();
      expect(result!.created_at).toBeInstanceOf(Date);
      expect(result!.updated_at).toBeInstanceOf(Date);
    });

    it('should login koordinator with valid credentials', async () => {
      const loginInput: LoginInput = {
        username: 'Ahmad Faqih Fajrin',
        password: 'Ahfin2615039798',
        role: 'koordinator'
      };

      const result = await login(loginInput);

      expect(result).toBeDefined();
      expect(result!.username).toEqual('Ahmad Faqih Fajrin');
      expect(result!.role).toEqual('koordinator');
      expect(result!.full_name).toEqual('Ahmad Faqih Fajrin');
      expect(result!.is_active).toEqual(true);
      expect(result!.password).toEqual(''); // Password should not be returned
    });

    it('should return null for invalid username', async () => {
      const loginInput: LoginInput = {
        username: 'invalid_user',
        password: 'guru1234567890',
        role: 'guru'
      };

      const result = await login(loginInput);
      expect(result).toBeNull();
    });

    it('should return null for invalid password', async () => {
      const loginInput: LoginInput = {
        username: 'guru0001',
        password: 'wrong_password',
        role: 'guru'
      };

      const result = await login(loginInput);
      expect(result).toBeNull();
    });

    it('should return null for wrong role', async () => {
      const loginInput: LoginInput = {
        username: 'guru0001',
        password: 'guru1234567890',
        role: 'koordinator' // Wrong role
      };

      const result = await login(loginInput);
      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      const loginInput: LoginInput = {
        username: 'guru0002',
        password: 'guru1234567890',
        role: 'guru'
      };

      const result = await login(loginInput);
      expect(result).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    let testUserId: number;

    beforeEach(async () => {
      // Insert test user and get ID
      const insertResult = await db.insert(usersTable)
        .values(testGuru)
        .returning()
        .execute();
      testUserId = insertResult[0].id;

      // Insert inactive user for testing
      await db.insert(usersTable).values(inactiveUser).execute();
    });

    it('should get current user by ID', async () => {
      const result = await getCurrentUser(testUserId);

      expect(result).toBeDefined();
      expect(result!.id).toEqual(testUserId);
      expect(result!.username).toEqual('guru0001');
      expect(result!.role).toEqual('guru');
      expect(result!.full_name).toEqual('Test Guru 1');
      expect(result!.is_active).toEqual(true);
      expect(result!.password).toEqual(''); // Password should not be returned
      expect(result!.created_at).toBeInstanceOf(Date);
      expect(result!.updated_at).toBeInstanceOf(Date);
    });

    it('should return null for non-existent user ID', async () => {
      const result = await getCurrentUser(99999);
      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      // Get inactive user ID
      const inactiveUsers = await db.select()
        .from(usersTable)
        .where(eq(usersTable.username, 'guru0002'))
        .execute();
      
      const inactiveUserId = inactiveUsers[0].id;
      const result = await getCurrentUser(inactiveUserId);
      expect(result).toBeNull();
    });
  });
});
