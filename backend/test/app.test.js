const request = require('supertest');
const app = require('../src/index');

// DB-dependent tests may return 503 in no-DB environments
const DB_STATUS = process.env.DB_HOST ? 200 : 503;
const DB_AUTH_STATUS = process.env.DB_HOST ? 400 : 503;

describe('Health Check', () => {
  it('should return ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('Auth API', () => {
  it('should reject registration with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it('should reject registration with short username', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'ab', password: '123456' });
    expect(res.status).toBe(400);
  });

  it('should reject registration with short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser123', password: '12345' });
    expect(res.status).toBe(400);
  });

  it('should reject login with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.status).toBe(400);
  });

  it('should handle login attempt (DB-dependent)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nonexistent_user_xyz', password: 'wrongpassword' });
    // Without DB returns 503, with DB returns 400
    expect([400, 503]).toContain(res.status);
    expect(res.body.message).toBeDefined();
  });

  it('should reject /auth/me without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('Vehicles API', () => {
  it('should handle vehicle list request', async () => {
    const res = await request(app).get('/api/vehicles');
    // Without DB returns 503, with DB returns 200
    expect([200, 503]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.vehicles).toBeDefined();
      expect(res.body.pagination).toBeDefined();
    }
  });

  it('should handle paginated vehicle list request', async () => {
    const res = await request(app).get('/api/vehicles?page=1&limit=5');
    expect([200, 503]).toContain(res.status);
  });

  it('should return 400 for invalid vehicle id', async () => {
    const res = await request(app).get('/api/vehicles/invalid');
    expect(res.status).toBe(400);
  });

  it('should reject POST without auth', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .send({ brand: 'test', model: 'test', year: 2023, price: 100000 });
    expect(res.status).toBe(401);
  });
});

describe('Users API', () => {
  it('should reject user list without auth', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('should reject profile update without auth', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .send({ email: 'test@test.com' });
    expect(res.status).toBe(401);
  });
});

describe('Favorites API', () => {
  it('should reject favorites without auth', async () => {
    const res = await request(app).get('/api/favorites');
    expect(res.status).toBe(401);
  });
});

describe('Messages API', () => {
  it('should reject conversations without auth', async () => {
    const res = await request(app).get('/api/messages/conversations');
    expect(res.status).toBe(401);
  });

  it('should reject sending message without auth', async () => {
    const res = await request(app)
      .post('/api/messages')
      .send({ receiverId: 1, content: 'test' });
    expect(res.status).toBe(401);
  });
});

describe('Admin API', () => {
  it('should reject admin stats without auth', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });

  it('should reject admin vehicles without auth', async () => {
    const res = await request(app).get('/api/admin/vehicles');
    expect(res.status).toBe(401);
  });
});

describe('Validation', () => {
  it('should validate vehicle id parameter', async () => {
    const res = await request(app).get('/api/vehicles/0');
    expect(res.status).toBe(400);
  });

  it('should validate negative vehicle id', async () => {
    const res = await request(app).get('/api/vehicles/-1');
    expect(res.status).toBe(400);
  });
});
