import {
  CampusBin,
  CampusVoucher,
  RedemptionRecord,
  UserReport
} from '../types';

export interface SqlDumpUserRow {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'petugas' | 'user';
  fullName: string;
  points: number;
  bottlesCount: number;
  foodWrappersCount: number;
  organicKg: number;
  improvementPercent: number;
  createdAt: string;
}

export interface SqlDumpInput {
  databaseName?: string;
  users: SqlDumpUserRow[];
  bins: CampusBin[];
  reports: UserReport[];
  vouchers: CampusVoucher[];
  redemptions: RedemptionRecord[];
  exportedAt?: string;
}

/**
 * Escapes a value safely for MySQL / MariaDB (phpMyAdmin compatible) INSERT statements.
 */
export function escapeSqlValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '0';
  }
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"');
  return `'${escaped}'`;
}

/**
 * Converts an ISO timestamp string to MySQL DATETIME format (`YYYY-MM-DD HH:MM:SS`).
 */
export function toMysqlDateTime(isoOrDate?: string | null): string {
  const d = isoOrDate ? new Date(isoOrDate) : new Date();
  const valid = Number.isNaN(d.getTime()) ? new Date() : d;
  return valid.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Generates a complete phpMyAdmin-compatible MySQL/MariaDB `.sql` dump
 * containing CREATE DATABASE, CREATE TABLE (InnoDB, utf8mb4), foreign keys,
 * and INSERT INTO statements for all VetBin tables.
 */
export function generatePhpMyAdminSqlDump(input: SqlDumpInput): string {
  const dbName = input.databaseName || 'vetbin_db';
  const exportedAt = input.exportedAt || new Date().toISOString();

  const lines: string[] = [
    '-- phpMyAdmin SQL Dump',
    '-- VetBin - Peta Tong Sampah Kampus & Admin Dashboard',
    `-- Generation Time: ${exportedAt}`,
    '-- Server version: 10.4.32-MariaDB / MySQL 8.0 compatible',
    '',
    'SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";',
    'START TRANSACTION;',
    'SET time_zone = "+00:00";',
    '',
    '/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;',
    '/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;',
    '/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;',
    '/*!40101 SET NAMES utf8mb4 */;',
    '',
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    `USE \`${dbName}\`;`,
    '',
    'SET FOREIGN_KEY_CHECKS = 0;',
    '',
    '-- --------------------------------------------------------',
    '-- Table structure for table `users`',
    '-- --------------------------------------------------------',
    'DROP TABLE IF EXISTS `redemption_records`;',
    'DROP TABLE IF EXISTS `user_reports`;',
    'DROP TABLE IF EXISTS `campus_vouchers`;',
    'DROP TABLE IF EXISTS `campus_bins`;',
    'DROP TABLE IF EXISTS `users`;',
    '',
    'CREATE TABLE `users` (',
    '  `id` varchar(64) NOT NULL,',
    '  `username` varchar(150) NOT NULL,',
    '  `password_hash` varchar(255) NOT NULL,',
    "  `role` enum('admin','petugas','user') NOT NULL DEFAULT 'user',",
    '  `full_name` varchar(150) NOT NULL,',
    '  `points` int(11) NOT NULL DEFAULT 0,',
    '  `bottles_count` int(11) NOT NULL DEFAULT 0,',
    '  `food_wrappers_count` int(11) NOT NULL DEFAULT 0,',
    '  `organic_kg` decimal(10,2) NOT NULL DEFAULT 0.00,',
    '  `improvement_percent` int(11) NOT NULL DEFAULT 0,',
    '  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,',
    '  PRIMARY KEY (`id`),',
    '  UNIQUE KEY `uniq_users_username` (`username`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;',
    '',
    '-- --------------------------------------------------------',
    '-- Table structure for table `campus_bins`',
    '-- --------------------------------------------------------',
    'CREATE TABLE `campus_bins` (',
    '  `id` varchar(64) NOT NULL,',
    '  `name` varchar(120) NOT NULL,',
    '  `category` varchar(60) NOT NULL,',
    '  `building` varchar(150) NOT NULL,',
    '  `location_detail` varchar(255) NOT NULL,',
    '  `distance_m` int(11) NOT NULL DEFAULT 0,',
    "  `status` enum('Kosong','Penuh','Rusak') NOT NULL DEFAULT 'Kosong',",
    '  `capacity_kg` int(11) NOT NULL DEFAULT 40,',
    '  `last_emptied` varchar(80) NOT NULL,',
    '  `reported_minutes_ago` int(11) DEFAULT NULL,',
    '  `qr_printed` tinyint(1) NOT NULL DEFAULT 1,',
    '  `coord_x` decimal(6,2) NOT NULL,',
    '  `coord_y` decimal(6,2) NOT NULL,',
    '  `description` text DEFAULT NULL,',
    '  PRIMARY KEY (`id`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;',
    '',
    '-- --------------------------------------------------------',
    '-- Table structure for table `user_reports`',
    '-- --------------------------------------------------------',
    'CREATE TABLE `user_reports` (',
    '  `id` varchar(64) NOT NULL,',
    '  `bin_id` varchar(64) NOT NULL,',
    '  `bin_name` varchar(120) NOT NULL,',
    '  `category` varchar(60) NOT NULL,',
    '  `location` varchar(255) NOT NULL,',
    '  `issue_type` varchar(60) NOT NULL,',
    '  `photo_url` longtext DEFAULT NULL,',
    '  `reported_at` datetime NOT NULL,',
    '  `time_ago_text` varchar(60) NOT NULL,',
    '  `reporter` varchar(40) NOT NULL,',
    '  `reported_by_username` varchar(150) DEFAULT NULL,',
    "  `status` enum('Baru','Diproses','Selesai','Ditolak') NOT NULL DEFAULT 'Baru',",
    '  `notes` text DEFAULT NULL,',
    '  `assigned_to_petugas` tinyint(1) NOT NULL DEFAULT 0,',
    '  `assigned_at` datetime DEFAULT NULL,',
    '  `admin_verification_note` text DEFAULT NULL,',
    '  PRIMARY KEY (`id`),',
    '  KEY `idx_reports_bin_id` (`bin_id`),',
    '  KEY `idx_reports_status` (`status`),',
    '  CONSTRAINT `fk_reports_bin` FOREIGN KEY (`bin_id`) REFERENCES `campus_bins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;',
    '',
    '-- --------------------------------------------------------',
    '-- Table structure for table `campus_vouchers`',
    '-- --------------------------------------------------------',
    'CREATE TABLE `campus_vouchers` (',
    '  `id` varchar(64) NOT NULL,',
    '  `partner_name` varchar(120) NOT NULL,',
    '  `voucher_title` varchar(160) NOT NULL,',
    '  `category` varchar(60) NOT NULL,',
    '  `point_cost` int(11) NOT NULL,',
    '  `stock` int(11) NOT NULL DEFAULT 0,',
    '  `redeemed_count` int(11) NOT NULL DEFAULT 0,',
    "  `status` enum('Aktif','Habis','Nonaktif') NOT NULL DEFAULT 'Aktif',",
    '  `description` text DEFAULT NULL,',
    '  PRIMARY KEY (`id`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;',
    '',
    '-- --------------------------------------------------------',
    '-- Table structure for table `redemption_records`',
    '-- --------------------------------------------------------',
    'CREATE TABLE `redemption_records` (',
    '  `id` varchar(64) NOT NULL,',
    '  `voucher_id` varchar(64) NOT NULL,',
    '  `voucher_title` varchar(160) NOT NULL,',
    '  `partner_name` varchar(120) NOT NULL,',
    '  `user_name` varchar(120) NOT NULL,',
    '  `user_id` varchar(64) DEFAULT NULL,',
    '  `points_spent` int(11) NOT NULL,',
    '  `time_ago_text` varchar(60) NOT NULL,',
    '  `redeem_code` varchar(64) NOT NULL,',
    '  `redeemed_at` datetime NOT NULL,',
    '  PRIMARY KEY (`id`),',
    '  UNIQUE KEY `uniq_redeem_code` (`redeem_code`),',
    '  KEY `idx_redemptions_voucher` (`voucher_id`),',
    '  KEY `idx_redemptions_user` (`user_id`),',
    '  CONSTRAINT `fk_redemptions_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `campus_vouchers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;',
    '',
    'SET FOREIGN_KEY_CHECKS = 1;',
    ''
  ];

  if (input.users.length > 0) {
    lines.push('-- Dumping data for table `users`');
    lines.push(
      'INSERT INTO `users` (`id`, `username`, `password_hash`, `role`, `full_name`, `points`, `bottles_count`, `food_wrappers_count`, `organic_kg`, `improvement_percent`, `created_at`) VALUES'
    );
    lines.push(
      input.users
        .map(
          (u) =>
            `(${[
              escapeSqlValue(u.id),
              escapeSqlValue(u.username),
              escapeSqlValue(u.passwordHash),
              escapeSqlValue(u.role),
              escapeSqlValue(u.fullName),
              escapeSqlValue(u.points),
              escapeSqlValue(u.bottlesCount),
              escapeSqlValue(u.foodWrappersCount),
              escapeSqlValue(u.organicKg),
              escapeSqlValue(u.improvementPercent),
              escapeSqlValue(toMysqlDateTime(u.createdAt))
            ].join(', ')})`
        )
        .join(',\n') + ';'
    );
    lines.push('');
  }

  if (input.bins.length > 0) {
    lines.push('-- Dumping data for table `campus_bins`');
    lines.push(
      'INSERT INTO `campus_bins` (`id`, `name`, `category`, `building`, `location_detail`, `distance_m`, `status`, `capacity_kg`, `last_emptied`, `reported_minutes_ago`, `qr_printed`, `coord_x`, `coord_y`, `description`) VALUES'
    );
    lines.push(
      input.bins
        .map(
          (b) =>
            `(${[
              escapeSqlValue(b.id),
              escapeSqlValue(b.name),
              escapeSqlValue(b.category),
              escapeSqlValue(b.building),
              escapeSqlValue(b.locationDetail),
              escapeSqlValue(b.distanceM),
              escapeSqlValue(b.status),
              escapeSqlValue(b.capacityKg),
              escapeSqlValue(b.lastEmptied),
              escapeSqlValue(b.reportedMinutesAgo ?? null),
              escapeSqlValue(b.qrPrinted),
              escapeSqlValue(b.coordinates.x),
              escapeSqlValue(b.coordinates.y),
              escapeSqlValue(b.description ?? null)
            ].join(', ')})`
        )
        .join(',\n') + ';'
    );
    lines.push('');
  }

  if (input.reports.length > 0) {
    lines.push('-- Dumping data for table `user_reports`');
    lines.push(
      'INSERT INTO `user_reports` (`id`, `bin_id`, `bin_name`, `category`, `location`, `issue_type`, `photo_url`, `reported_at`, `time_ago_text`, `reporter`, `reported_by_username`, `status`, `notes`, `assigned_to_petugas`, `assigned_at`, `admin_verification_note`) VALUES'
    );
    lines.push(
      input.reports
        .map(
          (r) =>
            `(${[
              escapeSqlValue(r.id),
              escapeSqlValue(r.binId),
              escapeSqlValue(r.binName),
              escapeSqlValue(r.category),
              escapeSqlValue(r.location),
              escapeSqlValue(r.issueType),
              escapeSqlValue(r.photoUrl ?? null),
              escapeSqlValue(toMysqlDateTime(r.timestamp)),
              escapeSqlValue(r.timeAgoText),
              escapeSqlValue(r.reporter),
              escapeSqlValue(r.reportedByUsername ?? null),
              escapeSqlValue(r.status),
              escapeSqlValue(r.notes ?? null),
              escapeSqlValue(Boolean(r.assignedToPetugas)),
              escapeSqlValue(r.assignedAt ? toMysqlDateTime(r.assignedAt) : null),
              escapeSqlValue(r.adminVerificationNote ?? null)
            ].join(', ')})`
        )
        .join(',\n') + ';'
    );
    lines.push('');
  }

  if (input.vouchers.length > 0) {
    lines.push('-- Dumping data for table `campus_vouchers`');
    lines.push(
      'INSERT INTO `campus_vouchers` (`id`, `partner_name`, `voucher_title`, `category`, `point_cost`, `stock`, `redeemed_count`, `status`, `description`) VALUES'
    );
    lines.push(
      input.vouchers
        .map(
          (v) =>
            `(${[
              escapeSqlValue(v.id),
              escapeSqlValue(v.partnerName),
              escapeSqlValue(v.voucherTitle),
              escapeSqlValue(v.category),
              escapeSqlValue(v.pointCost),
              escapeSqlValue(v.stock),
              escapeSqlValue(v.redeemedCount),
              escapeSqlValue(v.status),
              escapeSqlValue(v.description)
            ].join(', ')})`
        )
        .join(',\n') + ';'
    );
    lines.push('');
  }

  if (input.redemptions.length > 0) {
    lines.push('-- Dumping data for table `redemption_records`');
    lines.push(
      'INSERT INTO `redemption_records` (`id`, `voucher_id`, `voucher_title`, `partner_name`, `user_name`, `user_id`, `points_spent`, `time_ago_text`, `redeem_code`, `redeemed_at`) VALUES'
    );
    lines.push(
      input.redemptions
        .map(
          (rec) =>
            `(${[
              escapeSqlValue(rec.id),
              escapeSqlValue(rec.voucherId),
              escapeSqlValue(rec.voucherTitle),
              escapeSqlValue(rec.partnerName),
              escapeSqlValue(rec.userName),
              escapeSqlValue(rec.userId ?? null),
              escapeSqlValue(rec.pointsSpent),
              escapeSqlValue(rec.timeAgoText),
              escapeSqlValue(rec.redeemCode),
              escapeSqlValue(toMysqlDateTime(rec.timestamp))
            ].join(', ')})`
        )
        .join(',\n') + ';'
    );
    lines.push('');
  }

  lines.push('COMMIT;');
  lines.push('');
  lines.push('/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;');
  lines.push('/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;');
  lines.push('/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;');

  return lines.join('\n');
}
