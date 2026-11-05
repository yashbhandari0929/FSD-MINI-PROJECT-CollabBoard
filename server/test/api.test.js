import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateRoomId, sanitizeUserName, validateElement } from '../src/utils/validation.js';
import app from '../src/app.js';
import http from 'http';

describe('Validation Utilities', () => {
  test('validateRoomId accepts valid room strings', () => {
    assert.equal(validateRoomId('my-room-123'), 'my-room-123');
    assert.equal(validateRoomId('board_alpha'), 'board_alpha');
    assert.equal(validateRoomId('   valid-room   '), 'valid-room');
  });

  test('validateRoomId rejects invalid or malicious strings', () => {
    assert.equal(validateRoomId(''), null);
    assert.equal(validateRoomId('ab'), null); // too short
    assert.equal(validateRoomId('room/with/slashes'), null);
    assert.equal(validateRoomId('<script>'), null);
    assert.equal(validateRoomId(null), null);
  });

  test('sanitizeUserName cleans and truncates inputs', () => {
    assert.equal(sanitizeUserName('Alice'), 'Alice');
    assert.equal(sanitizeUserName('  <b>Bob</b>  '), 'Bob');
    assert.equal(sanitizeUserName(''), 'Collaborator');
  });

  test('validateElement validates strokes correctly', () => {
    const validStroke = {
      id: 'stroke-1',
      type: 'stroke',
      points: [{ x: 10, y: 20 }, { x: 15, y: 25 }],
      color: '#000000',
      size: 4
    };
    assert.equal(validateElement(validStroke), true);

    const invalidStroke = {
      id: 'stroke-2',
      type: 'stroke',
      points: [] // empty points
    };
    assert.equal(validateElement(invalidStroke), false);
  });

  test('validateElement validates geometric shapes correctly', () => {
    const validRect = {
      id: 'rect-1',
      type: 'rectangle',
      startX: 10,
      startY: 10,
      endX: 100,
      endY: 80,
      color: '#4f46e5',
      size: 2
    };
    assert.equal(validateElement(validRect), true);

    const invalidRect = {
      id: 'rect-2',
      type: 'rectangle',
      startX: 'not-a-number'
    };
    assert.equal(validateElement(invalidRect), false);
  });
});

describe('Express REST API Endpoints', () => {
  test('GET /api/health returns 200 with status ok and DB mode', async () => {
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    const res = await fetch(`http://localhost:${port}/api/health`);
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.status, 'ok');
    assert.ok(data.database);
    assert.ok(typeof data.database.connected === 'boolean');
    assert.ok(data.database.mode);

    server.close();
  });

  test('POST /api/boards creates a board with generated or provided ID', async () => {
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    const res = await fetch(`http://localhost:${port}/api/boards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: 'test-board-99', title: 'Test Room' })
    });
    const data = await res.json();

    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.equal(data.board.roomId, 'test-board-99');
    assert.equal(data.board.title, 'Test Room');

    server.close();
  });
});
