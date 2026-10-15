import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('tickets API', () => {
  it('lists seeded tickets', async () => {
    const app = createApp();
    const res = await request(app).get('/api/tickets');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('creates ticket and defaults to Open', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/tickets')
      .send({ title: 'Printer is broken', description: 'Office printer jam', priority: 'High' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('Open');
    expect(res.body.id).toBeTruthy();
  });

  it('validates title required', async () => {
    const app = createApp();
    const res = await request(app).post('/api/tickets').send({ title: '', priority: 'Low' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('soft deletes and then 404 on get', async () => {
    const app = createApp();
    const created = await request(app)
      .post('/api/tickets')
      .send({ title: 'To delete', description: 'x', priority: 'Low' });

    const id = created.body.id;
    const del = await request(app).delete(`/api/tickets/${id}`);
    expect(del.status).toBe(204);

    const get = await request(app).get(`/api/tickets/${id}`);
    expect(get.status).toBe(404);
    expect(get.body.code).toBe('NOT_FOUND');
  });
});
