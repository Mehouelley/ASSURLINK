import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `test-${Date.now()}@example.com`,
          password: 'TestPassword123!',
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email');
    });

    it('should fail with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'TestPassword123!',
        })
        .expect(400);
    });

    it('should fail with short password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `test-${Date.now()}@example.com`,
          password: 'short',
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    let testEmail: string;
    let testPassword: string;

    beforeAll(async () => {
      testEmail = `login-test-${Date.now()}@example.com`;
      testPassword = 'TestPassword123!';

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
        });
    });

    it('should successfully login', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body.user.email).toBe(testEmail);
    });

    it('should fail with wrong password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('should fail with non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword,
        })
        .expect(401);
    });
  });

  describe('GET /auth/me', () => {
    let accessToken: string;

    beforeAll(async () => {
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `me-test-${Date.now()}@example.com`,
          password: 'TestPassword123!',
        });

      accessToken = registerResponse.body.access_token;
    });

    it('should return current user info with valid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('role');
        });
    });

    it('should fail without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('should fail with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `refresh-test-${Date.now()}@example.com`,
          password: 'TestPassword123!',
        });

      refreshToken = registerResponse.body.refresh_token;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.access_token).toBeTruthy();
    });

    it('should fail with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: 'invalid.token.here' })
        .expect(401);
    });
  });
});
