import request from 'supertest';
import { app } from '../index';

describe('FPL API Tests', () => {
  it('should fetch bootstrap static data', async () => {
    const response = await request(app).get('/api/fpl/bootstrap-static');
    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
  });

  it('should fetch player data', async () => {
    const response = await request(app).get('/api/fpl/players');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should fetch fixtures', async () => {
    const response = await request(app).get('/api/fpl/fixtures');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
