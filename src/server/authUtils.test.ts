import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, generateSessionToken } from './authUtils';

test('hashPassword and verifyPassword authenticate Admin and User credentials', () => {
  const adminHash = hashPassword('Admin');
  assert.ok(adminHash.startsWith('scrypt$'));
  assert.equal(verifyPassword('Admin', adminHash), true);
  assert.equal(verifyPassword('admin', adminHash), false);
  assert.equal(verifyPassword('wrong', adminHash), false);

  const userHash = hashPassword('2510501272@kampus.ac.id');
  assert.equal(verifyPassword('2510501272@kampus.ac.id', userHash), true);
  assert.equal(verifyPassword('2510501272', userHash), false);
});

test('verifyPassword safely rejects malformed hashes', () => {
  assert.equal(verifyPassword('Admin', ''), false);
  assert.equal(verifyPassword('Admin', 'plain$text'), false);
  assert.equal(verifyPassword('Admin', 'scrypt$bad$hex'), false);
});

test('generateSessionToken produces unique 64-char hex tokens', () => {
  const t1 = generateSessionToken();
  const t2 = generateSessionToken();
  assert.equal(t1.length, 64);
  assert.equal(t2.length, 64);
  assert.notEqual(t1, t2);
});
