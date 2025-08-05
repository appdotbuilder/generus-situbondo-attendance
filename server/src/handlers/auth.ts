
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type User } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function login(input: LoginInput): Promise<User | null> {
  try {
    // Query user by username and role
    const users = await db.select()
      .from(usersTable)
      .where(and(
        eq(usersTable.username, input.username),
        eq(usersTable.role, input.role),
        eq(usersTable.is_active, true)
      ))
      .execute();

    if (users.length === 0) {
      return null;
    }

    const user = users[0];

    // Verify password (in production, this would use proper password hashing)
    if (user.password !== input.password) {
      return null;
    }

    // Return user without password
    return {
      ...user,
      password: '' // Don't return password in response
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

export async function getCurrentUser(userId: number): Promise<User | null> {
  try {
    const users = await db.select()
      .from(usersTable)
      .where(and(
        eq(usersTable.id, userId),
        eq(usersTable.is_active, true)
      ))
      .execute();

    if (users.length === 0) {
      return null;
    }

    const user = users[0];

    // Return user without password
    return {
      ...user,
      password: '' // Don't return password in response
    };
  } catch (error) {
    console.error('Get current user failed:', error);
    throw error;
  }
}
