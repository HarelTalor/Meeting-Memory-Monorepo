import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app';
import type { Redis } from 'ioredis';

// ─── Mock Redis ───────────────────────────────────────────────────────────────

const store = new Map<string, string>();
const mockRedis = {
  set: jest.fn(async (key: string, value: string) => { store.set(key, value); return 'OK'; }),
  get: jest.fn(async (key: string) => store.get(key) ?? null),
  del: jest.fn(async (key: string) => { store.delete(key); return 1; }),
  on: jest.fn(),
} as unknown as Redis;

// ─── Test setup ───────────────────────────────────────────────────────────────

let mongod: MongoMemoryServer;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = createApp(mockRedis);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await mongoose.connection.dropDatabase();
  store.clear();
  jest.clearAllMocks();
});

// ─── Registration tests ───────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('should register a new user and return tokens', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'Password1', displayName: 'Test User' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('should reject duplicate email with 409', async () => {
    const payload = { email: 'dup@example.com', password: 'Password1', displayName: 'Dup User' };
    await request(app).post('/api/auth/register').send(payload);
    const res = await request(app).post('/api/auth/register').send(payload);

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('type');
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
  });

  it('should reject weak password with 422', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'weak@example.com', password: 'weak', displayName: 'User' });

    expect(res.status).toBe(422);
    expect(res.body.title).toBe('Validation Error');
  });

  it('should reject invalid email with 422', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'Password1', displayName: 'User' });

    expect(res.status).toBe(422);
    expect(res.body.errors[0].field).toBe('email');
  });
});

// ─── Login tests ──────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      email: 'user@example.com', password: 'Password1', displayName: 'User',
    });
  });

  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'Password1' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user.email).toBe('user@example.com');
  });

  it('should reject wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'WrongPass1' });

    expect(res.status).toBe(401);
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
  });

  it('should reject non-existent user with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Password1' });

    expect(res.status).toBe(401);
  });
});

// ─── Health check ─────────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('should return 200 with service info', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('auth-service');
  });
});
