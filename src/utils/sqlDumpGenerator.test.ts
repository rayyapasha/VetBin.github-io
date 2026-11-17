import test from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeSqlValue,
  generatePhpMyAdminSqlDump,
  toMysqlDateTime
} from './sqlDumpGenerator';

test('escapeSqlValue escapes quotes, backslashes, nulls, and booleans safely', () => {
  assert.equal(escapeSqlValue(null), 'NULL');
  assert.equal(escapeSqlValue(undefined), 'NULL');
  assert.equal(escapeSqlValue(true), '1');
  assert.equal(escapeSqlValue(false), '0');
  assert.equal(escapeSqlValue(42), '42');
  assert.equal(escapeSqlValue("It's a \\test\nline"), "'It\\'s a \\\\test\\nline'");
});

test('toMysqlDateTime converts ISO timestamp to MySQL DATETIME string', () => {
  assert.equal(toMysqlDateTime('2026-11-17T10:15:30.000Z'), '2026-11-17 10:15:30');
});

test('generatePhpMyAdminSqlDump emits valid phpMyAdmin SQL structure and data', () => {
  const dump = generatePhpMyAdminSqlDump({
    databaseName: 'vetbin_db',
    exportedAt: '2026-11-17T10:00:00Z',
    users: [
      {
        id: 'usr-admin',
        username: 'Admin',
        passwordHash: 'scrypt$abc$def',
        role: 'admin',
        fullName: 'Administrator Kampus',
        points: 0,
        bottlesCount: 0,
        foodWrappersCount: 0,
        organicKg: 0,
        improvementPercent: 0,
        createdAt: '2026-11-17T10:00:00Z'
      },
      {
        id: 'usr-petugas',
        username: 'Petugas',
        passwordHash: 'scrypt$pet$ugas',
        role: 'petugas',
        fullName: 'Petugas Kebersihan Kampus',
        points: 0,
        bottlesCount: 0,
        foodWrappersCount: 0,
        organicKg: 0,
        improvementPercent: 0,
        createdAt: '2026-11-17T10:00:00Z'
      },
      {
        id: 'usr-1',
        username: '2510501272@kampus.ac.id',
        passwordHash: 'scrypt$123$456',
        role: 'user',
        fullName: 'Mahasiswa Kampus',
        points: 1240,
        bottlesCount: 86,
        foodWrappersCount: 32,
        organicKg: 14,
        improvementPercent: 22,
        createdAt: '2026-11-17T10:00:00Z'
      }
    ],
    bins: [
      {
        id: 'bin-1',
        name: 'Tong Anorganik',
        category: 'Anorganik',
        building: 'Kantin Kampus',
        locationDetail: 'Teras depan',
        distanceM: 35,
        status: 'Kosong',
        capacityKg: 50,
        lastEmptied: 'Hari ini 07.30',
        qrPrinted: true,
        coordinates: { x: 46, y: 64 },
        description: "Tong 'kuning' utama"
      }
    ],
    reports: [
      {
        id: 'rep-1',
        binId: 'bin-1',
        binName: 'Tong Anorganik',
        category: 'Anorganik',
        location: 'Kantin Kampus',
        issueType: 'Penuh',
        timestamp: '2026-11-17T10:00:00Z',
        timeAgoText: 'Baru saja',
        reporter: 'Mahasiswa',
        reportedByUsername: '2510501272@kampus.ac.id',
        status: 'Baru',
        notes: 'Penuh sekali',
        assignedToPetugas: false
      }
    ],
    vouchers: [
      {
        id: 'vouc-1',
        partnerName: 'Kantin Bu Ani',
        voucherTitle: 'Diskon 10%',
        category: 'Kantin',
        pointCost: 150,
        stock: 100,
        redeemedCount: 5,
        status: 'Aktif',
        description: 'Semua menu'
      }
    ],
    redemptions: [
      {
        id: 'red-1',
        voucherId: 'vouc-1',
        voucherTitle: 'Diskon 10%',
        partnerName: 'Kantin Bu Ani',
        userName: '2510501272',
        userId: 'usr-1',
        pointsSpent: 150,
        timeAgoText: 'Baru saja',
        redeemCode: 'VETBIN-TEST-1234',
        timestamp: '2026-11-17T10:00:00Z'
      }
    ]
  });

  assert.ok(dump.includes('-- phpMyAdmin SQL Dump'));
  assert.ok(dump.includes('CREATE DATABASE IF NOT EXISTS `vetbin_db`'));
  assert.ok(dump.includes('CREATE TABLE `users`'));
  assert.ok(dump.includes("enum('admin','petugas','user')"));
  assert.ok(dump.includes('CREATE TABLE `campus_bins`'));
  assert.ok(dump.includes('CREATE TABLE `user_reports`'));
  assert.ok(dump.includes('CREATE TABLE `campus_vouchers`'));
  assert.ok(dump.includes('CREATE TABLE `redemption_records`'));
  assert.ok(dump.includes("'Admin'"));
  assert.ok(dump.includes("'Petugas'"));
  assert.ok(dump.includes("'2510501272@kampus.ac.id'"));
  assert.ok(dump.includes("'Tong \\'kuning\\' utama'"));
  assert.ok(dump.includes('COMMIT;'));
});
