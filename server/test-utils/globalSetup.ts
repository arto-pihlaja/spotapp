import { execSync } from 'node:child_process';

export default function globalSetup() {
  // Push schema to test DB once before all test files
  execSync('npx prisma db push --force-reset --schema=prisma/schema.prisma', {
    cwd: '/opt/spotapp/server',
    env: {
      ...process.env,
      DATABASE_URL: 'postgresql://spotsapp:spotsapp@localhost:5432/spotsapp_test?schema=public',
      PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: 'yes',
    },
    stdio: 'pipe',
  });
}
