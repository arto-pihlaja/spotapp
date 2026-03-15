// Set test environment BEFORE any app code loads.
// We set these directly on process.env to guarantee they take effect
// regardless of how dotenv behaves in env.ts.
process.env.DATABASE_URL = 'postgresql://spotsapp:spotsapp@localhost:5432/spotsapp_test?schema=public';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-min-16-chars!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-16-chars!';
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.CORS_ORIGIN = 'http://localhost:8081';
