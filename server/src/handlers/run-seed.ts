#!/usr/bin/env bun
import 'dotenv/config';
import { seedUsers } from './seed';

async function main() {
  console.log('Running database seeding...');
  await seedUsers();
  console.log('Database seeding completed.');
  process.exit(0);
}

main().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});