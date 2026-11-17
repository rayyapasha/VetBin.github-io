-- phpMyAdmin SQL Dump
-- VetBin - Peta Tong Sampah Kampus & Admin Dashboard
-- Generation Time: 2026-11-17T18:12:42.812Z
-- Server version: 10.4.32-MariaDB / MySQL 8.0 compatible

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

CREATE DATABASE IF NOT EXISTS `vetbin_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `vetbin_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `redemption_records`;
DROP TABLE IF EXISTS `user_reports`;
DROP TABLE IF EXISTS `campus_vouchers`;
DROP TABLE IF EXISTS `campus_bins`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` varchar(64) NOT NULL,
  `username` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `full_name` varchar(150) NOT NULL,
  `points` int(11) NOT NULL DEFAULT 0,
  `bottles_count` int(11) NOT NULL DEFAULT 0,
  `food_wrappers_count` int(11) NOT NULL DEFAULT 0,
  `organic_kg` decimal(10,2) NOT NULL DEFAULT 0.00,
  `improvement_percent` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `campus_bins`
-- --------------------------------------------------------
CREATE TABLE `campus_bins` (
  `id` varchar(64) NOT NULL,
  `name` varchar(120) NOT NULL,
  `category` varchar(60) NOT NULL,
  `building` varchar(150) NOT NULL,
  `location_detail` varchar(255) NOT NULL,
  `distance_m` int(11) NOT NULL DEFAULT 0,
  `status` enum('Kosong','Penuh','Rusak') NOT NULL DEFAULT 'Kosong',
  `capacity_kg` int(11) NOT NULL DEFAULT 40,
  `last_emptied` varchar(80) NOT NULL,
  `reported_minutes_ago` int(11) DEFAULT NULL,
  `qr_printed` tinyint(1) NOT NULL DEFAULT 1,
  `coord_x` decimal(6,2) NOT NULL,
  `coord_y` decimal(6,2) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `user_reports`
-- --------------------------------------------------------
CREATE TABLE `user_reports` (
  `id` varchar(64) NOT NULL,
  `bin_id` varchar(64) NOT NULL,
  `bin_name` varchar(120) NOT NULL,
  `category` varchar(60) NOT NULL,
  `location` varchar(255) NOT NULL,
  `issue_type` varchar(60) NOT NULL,
  `photo_url` longtext DEFAULT NULL,
  `reported_at` datetime NOT NULL,
  `time_ago_text` varchar(60) NOT NULL,
  `reporter` varchar(40) NOT NULL,
  `reported_by_username` varchar(150) DEFAULT NULL,
  `status` enum('Baru','Diproses','Selesai','Ditolak') NOT NULL DEFAULT 'Baru',
  `notes` text DEFAULT NULL,
  `assigned_to_petugas` tinyint(1) NOT NULL DEFAULT 0,
  `assigned_at` datetime DEFAULT NULL,
  `admin_verification_note` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_reports_bin_id` (`bin_id`),
  KEY `idx_reports_status` (`status`),
  CONSTRAINT `fk_reports_bin` FOREIGN KEY (`bin_id`) REFERENCES `campus_bins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `campus_vouchers`
-- --------------------------------------------------------
CREATE TABLE `campus_vouchers` (
  `id` varchar(64) NOT NULL,
  `partner_name` varchar(120) NOT NULL,
  `voucher_title` varchar(160) NOT NULL,
  `category` varchar(60) NOT NULL,
  `point_cost` int(11) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `redeemed_count` int(11) NOT NULL DEFAULT 0,
  `status` enum('Aktif','Habis','Nonaktif') NOT NULL DEFAULT 'Aktif',
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `redemption_records`
-- --------------------------------------------------------
CREATE TABLE `redemption_records` (
  `id` varchar(64) NOT NULL,
  `voucher_id` varchar(64) NOT NULL,
  `voucher_title` varchar(160) NOT NULL,
  `partner_name` varchar(120) NOT NULL,
  `user_name` varchar(120) NOT NULL,
  `user_id` varchar(64) DEFAULT NULL,
  `points_spent` int(11) NOT NULL,
  `time_ago_text` varchar(60) NOT NULL,
  `redeem_code` varchar(64) NOT NULL,
  `redeemed_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_redeem_code` (`redeem_code`),
  KEY `idx_redemptions_voucher` (`voucher_id`),
  KEY `idx_redemptions_user` (`user_id`),
  CONSTRAINT `fk_redemptions_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `campus_vouchers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Dumping data for table `users`
INSERT INTO `users` (`id`, `username`, `password_hash`, `role`, `full_name`, `points`, `bottles_count`, `food_wrappers_count`, `organic_kg`, `improvement_percent`, `created_at`) VALUES
('usr-admin', 'Admin', 'scrypt$a07058ac044c6e5902a6db18092a2e34$b57d3af51c12916e421411c5b62d10811a3f4e2a84194c6e5290a7682f822b2af6b7aaa1059c68ea045971b245d08c8d8bf1d332440b4b540a53ca6feb7a7336', 'admin', 'Administrator Sarpras Kampus', 0, 0, 0, 0, 0, '2026-11-17 18:03:50'),
('usr-2510501272', '2510501272@kampus.ac.id', 'scrypt$6024a01f74d86a1b5eb1da9d2df19c53$50af53b5fcd32315954dacfd6b5a66ea95265e41358c5289a185f320354187361890ca013cdb3ddf727d5f18beff067f4df3173a2c225d8534dd01f9937ddd1a', 'user', 'Mahasiswa (2510501272)', 1240, 86, 32, 14, 22, '2026-11-17 18:03:50');

-- Dumping data for table `campus_bins`
INSERT INTO `campus_bins` (`id`, `name`, `category`, `building`, `location_detail`, `distance_m`, `status`, `capacity_kg`, `last_emptied`, `reported_minutes_ago`, `qr_printed`, `coord_x`, `coord_y`, `description`) VALUES
('bin-1', 'Tong Anorganik', 'Anorganik', 'Kantin Kampus', 'Teras depan pintu lobi kantin', 35, 'Kosong', 50, 'Hari ini 07.30', NULL, 1, 46, 64, 'Tong kuning kapasitas besar di teras depan loket makanan kantin'),
('bin-2', 'Tong Organik', 'Organik', 'Kantin Kampus', 'Selasar area cuci tangan outdoor kantin', 45, 'Kosong', 60, 'Hari ini 06.45', NULL, 1, 50, 91, 'Tong hijau berpenutup rapat anti-bau untuk sisa makanan'),
('bin-3', 'Tong Anorganik', 'Anorganik', 'Gd. Jend. Sudirman (Rektorat)', 'Selasar samping pintu aula lobi utama', 55, 'Kosong', 40, 'Hari ini 07.10', NULL, 1, 24, 20, 'Tong kuning ramping di selasar masuk aula rektorat'),
('bin-4', 'Dropbox Kertas', 'Kertas', 'Gd. Dr. MH. Thamrin (FEB)', 'Lobi barat samping ruang fotokopi FEB', 75, 'Kosong', 35, 'Kemarin 16.10', NULL, 1, 27, 27, 'Dropbox biru dokumen, modul, dan kertas fotokopi'),
('bin-5', 'Tong Anorganik', 'Anorganik', 'Lapangan Basket', 'Selasar pinggir tribun barat basket', 95, 'Penuh', 45, 'Kemarin 10.20', 12, 1, 64, 59, 'Tong kuning sering penuh botol air mineral setelah olahraga'),
('bin-6', 'Tong Anorganik', 'Anorganik', 'Masjid Kampus', 'Selasar samping rak sepatu pintu masuk', 110, 'Kosong', 35, 'Hari ini 08.05', NULL, 1, 71.5, 59, 'Tong kuning bersih untuk jamaah & mahasiswa'),
('bin-7', 'Tong Anorganik', 'Anorganik', 'Pos Masuk Barat', 'Selasar pos keamanan gerbang barat', 115, 'Rusak', 40, 'Kemarin 15.00', NULL, 0, 8, 55, 'Tutup pedal patah akibat desakan jam sibuk pagi'),
('bin-8', 'Dropbox E-waste', 'E-waste / Baterai', 'Gd. Dewi Sartika (FIK)', 'Lobi depan Lab Jaringan & IoT FIK 2', 135, 'Kosong', 20, '3 hari lalu', NULL, 1, 66, 81, 'Dropbox merah aman baterai, kabel rusak, dan komponen PCB'),
('bin-9', 'Dropbox Kertas & Formulir', 'Kertas', 'Gd. Dr. Soepomo (Fak. Ekonomi & Bisnis)', 'Selasar samping pintu masuk lobi FEB', 70, 'Kosong', 35, 'Hari ini 08.10', NULL, 1, 32, 31, 'Dropbox biru berkas formulir dan modul kuliah FEB'),
('bin-10', 'Tong Anorganik', 'Anorganik', 'Gd. Yos Sudarso (Fak. Hukum)', 'Teras lobi depan Fak. Hukum', 140, 'Kosong', 45, 'Hari ini 07.00', NULL, 1, 73, 30, 'Tong kuning kapasitas sedang untuk mahasiswa hukum'),
('bin-11', 'Dropbox Kertas & Arsip', 'Kertas', 'Gd. RA. Kartini (Pusbabimkar)', 'Teras depan loket bimbingan karir', 65, 'Kosong', 35, 'Hari ini 06.30', NULL, 1, 38, 52, 'Dropbox biru berkas formulir dan administrasi mahasiswa'),
('bin-12', 'Tong Anorganik', 'Anorganik', 'Gd. Dr. Wahidin (Fak. Kedokteran)', 'Teras lobi pintu utama FK', 60, 'Kosong', 35, 'Hari ini 08.15', NULL, 1, 37, 31, 'Tong kuning higienis area fakultas kedokteran'),
('bin-13', 'Dropbox Kertas & Modul', 'Kertas', 'Gd. Dr. Moh. Yamin (FISIP)', 'Selasar samping pintu masuk BEM FISIP', 85, 'Kosong', 35, 'Hari ini 08.30', NULL, 1, 26, 14, 'Dropbox biru untuk lembar ujian dan modul mahasiswa'),
('bin-14', 'Tong Organik Taman', 'Organik', 'Lapangan Utama', 'Sudut bangku taman upacara & olahraga', 70, 'Kosong', 50, 'Hari ini 06.15', NULL, 1, 54.5, 29, 'Tong hijau daun taman dan sisa makanan ringan'),
('bin-15', 'Tong Anorganik', 'Anorganik', 'Gd. Ki Hajar Dewantoro (FIK)', 'Lobi barat pintu masuk FIK 1', 125, 'Kosong', 40, 'Hari ini 07.45', NULL, 1, 81.5, 59, 'Tong kuning anorganik botol kemasan untuk mahasiswa praktikum komputer'),
('bin-16', 'Dropbox E-waste & Baterai Lab', 'E-waste / Baterai', 'Gd. Cipto Mangunkusumo', 'Selasar samping pintu Lab Skill FK', 150, 'Kosong', 25, '2 hari lalu', NULL, 1, 75, 22, 'Dropbox khusus baterai alat medik dan komponen sirkuit'),
('bin-17', 'Tong Organik Ramah Lingkungan', 'Organik', 'Gd. Soetomo (Perpustakaan)', 'Teras depan lobi perpustakaan kampus', 90, 'Kosong', 40, 'Hari ini 08.00', NULL, 1, 58.5, 52, 'Tong hijau higienis untuk pengunjung perpustakaan pusat kampus'),
('bin-18', 'Tong Anorganik', 'Anorganik', 'Gd. Dewi Sartika (FIK)', 'Selasar sayap timur lobi FIK 2', 120, 'Kosong', 45, 'Hari ini 07.20', NULL, 1, 74, 84, 'Tong kuning anorganik botol anorganik dan kaleng minuman mahasiswa FIK'),
('bin-19', 'Tong Anorganik', 'Anorganik', 'Gd. Abd. Rahman Saleh', 'Lobi barat depan Lab Terpadu', 110, 'Kosong', 35, 'Hari ini 08.20', NULL, 1, 55.5, 19, 'Tong anorganik higienis untuk pengunjung Lab Terpadu'),
('bin-20', 'Tong Anorganik', 'Anorganik', 'Gd. Pratama', 'Teras depan pintu masuk Gd. Pratama', 50, 'Kosong', 30, 'Hari ini 07.50', NULL, 1, 23, 52, 'Tong anorganik di samping pintu masuk Gd. Pratama');

-- Dumping data for table `user_reports`
INSERT INTO `user_reports` (`id`, `bin_id`, `bin_name`, `category`, `location`, `issue_type`, `photo_url`, `reported_at`, `time_ago_text`, `reporter`, `reported_by_username`, `status`, `notes`, `assigned_to_petugas`, `assigned_at`, `admin_verification_note`) VALUES
('rep-1', 'bin-5', 'Tong Anorganik', 'Anorganik', 'Lapangan Utama & Basket · Selasar tribun', 'Penuh', NULL, '2026-11-09 04:43:00', '2 mnt lalu', 'Mahasiswa', NULL, 'Baru', 'Banyak botol anorganik dan cup es teh meluap ke lantai seusai pertandingan basket.', 0, NULL, NULL),
('rep-2', 'bin-2', 'Tong Organik', 'Organik', 'Kantin Kampus · Teras wastafel', 'Bau tidak sedap', NULL, '2026-11-09 04:27:00', '18 mnt lalu', 'Petugas', NULL, 'Baru', 'Sisa makanan seafood dan kuah mulai berbau menyengat, perlu segera diangkut dan disemprot disinfektan.', 0, NULL, NULL),
('rep-3', 'bin-7', 'Tong Anorganik', 'Anorganik', 'Pos Masuk Barat · Pos palang masuk', 'Tutup macet', NULL, '2026-11-09 03:45:00', '1 jam lalu', 'Mahasiswa', NULL, 'Diproses', 'Pedal injak bawah tersangkut batu dan penutup miring tidak mau terbuka.', 1, '2026-11-09 03:50:00', 'Diverifikasi asli & dikirim ke petugas kebersihan shift pagi'),
('rep-4', 'bin-9', 'Tong Organik', 'Organik', 'Gd. Graha Adya Wicaksana · Selasar aula barat', 'Penuh', NULL, '2026-11-09 02:45:00', '2 jam lalu', 'Dosen', NULL, 'Diproses', 'Kotak modul kertas dan kardus konsumsi rapat dosen meluap keluar tong.', 1, '2026-11-09 02:50:00', 'Diverifikasi asli oleh admin'),
('rep-5', 'bin-1', 'Tong Anorganik', 'Anorganik', 'Kantin Kampus · Lorong kuliner depan stan minuman es', 'Sampah berserakan', NULL, '2026-11-09 01:45:00', '3 jam lalu', 'Mahasiswa', NULL, 'Selesai', 'Cup anorganik berceceran di lantai, sudah disapu bersih oleh petugas piket.', 0, NULL, NULL),
('rep-6', 'bin-8', 'Dropbox E-waste', 'E-waste / Baterai', 'Gd. Dewi Sartika (FIK) · Lobi Lab', 'Label salah', NULL, '2026-11-08 15:00:00', 'Kemarin', 'Petugas', NULL, 'Selesai', 'Label petunjuk baterai lithium telah diperbarui dengan stiker anti-air.', 0, NULL, NULL),
('rep-7', 'bin-3', 'Tong Anorganik', 'Anorganik', 'Gd. Jend. Sudirman (Rektorat) · Lobi lantai 1', 'Penuh', NULL, '2026-11-08 12:00:00', 'Kemarin', 'Mahasiswa', NULL, 'Selesai', 'Sudah dikosongkan shift sore.', 0, NULL, NULL),
('rep-8', 'bin-4', 'Dropbox Kertas', 'Kertas', 'Gd. Dr. MH. Thamrin (FEB) · Lantai 1', 'Rusak', NULL, '2026-11-07 10:00:00', '2 hari lalu', 'Petugas', NULL, 'Selesai', 'Kait engsel penutup sudah diperbaiki teknisi sarpras.', 0, NULL, NULL);

-- Dumping data for table `campus_vouchers`
INSERT INTO `campus_vouchers` (`id`, `partner_name`, `voucher_title`, `category`, `point_cost`, `stock`, `redeemed_count`, `status`, `description`) VALUES
('vouc-1', 'Kantin Bu Ani', 'Diskon 10% semua menu', 'Kantin', 150, 120, 86, 'Aktif', 'Berlaku untuk paket nasi rames dan aneka lauk di Kantin Bu Ani.'),
('vouc-2', 'Kopi Kampus', 'Gratis es teh manis', 'Kantin', 100, 80, 54, 'Aktif', 'Nikmati es teh manis dingin segar gratis saat makan siang.'),
('vouc-3', 'Fotokopi Jaya', 'Potongan Rp3.000 fotokopi', 'Cetak', 120, 200, 41, 'Aktif', 'Potongan langsung biaya jilid dan fotokopi materi kuliah.'),
('vouc-4', 'Toko Buku Pelita', 'Diskon 15% alat tulis', 'Alat Tulis', 200, 45, 19, 'Aktif', 'Diskon alat tulis pena, binder, map, dan sticky notes.'),
('vouc-5', 'Koperasi Mahasiswa', 'Tumbler VetBin', 'Merchandise', 500, 12, 7, 'Aktif', 'Tumbler stainless edisi terbatas VetBin ramah lingkungan.'),
('vouc-6', 'Warung Hijau', 'Gratis 1 porsi salad', 'Kantin', 250, 0, 12, 'Habis', 'Salad sayur organik lokal kampus dengan saus wijen sangrai.'),
('vouc-7', 'Kopi Kampus', 'Diskon 20% kopi susu', 'Kantin', 180, 60, 0, 'Nonaktif', 'Kopi susu gula aren andalan mahasiswa.'),
('vouc-8', 'Kantin Utama', 'Voucher Kantin Rp10.000', 'Kantin', 500, 50, 28, 'Aktif', 'Berlaku di semua stan kantin kampus tanpa syarat minimum pembelian.'),
('vouc-9', 'Fotokopi Jaya', 'Diskon Cetak 20%', 'Cetak', 300, 75, 35, 'Aktif', 'Untuk layanan cetak laporan praktikum dan fotokopi skripsi.'),
('vouc-10', 'Kantin Teras', 'Es Teh Gratis', 'Kantin', 200, 100, 62, 'Aktif', 'Tukar di kantin mitra pilihan.');

-- Dumping data for table `redemption_records`
INSERT INTO `redemption_records` (`id`, `voucher_id`, `voucher_title`, `partner_name`, `user_name`, `user_id`, `points_spent`, `time_ago_text`, `redeem_code`, `redeemed_at`) VALUES
('red-1', 'vouc-2', 'Gratis es teh manis', 'Kopi Kampus', 'Rani A.', NULL, 100, '3 mnt lalu', 'VETBIN-TEH-8821', '2026-11-09 04:42:00'),
('red-2', 'vouc-1', 'Diskon 10% semua menu', 'Kantin Bu Ani', 'Dimas P.', NULL, 150, '21 mnt lalu', 'VETBIN-ANI-4412', '2026-11-09 04:24:00'),
('red-3', 'vouc-3', 'Potongan Rp3.000 fotokopi', 'Fotokopi Jaya', 'Salsa N.', NULL, 120, '1 jam lalu', 'VETBIN-FC-9011', '2026-11-09 03:45:00'),
('red-4', 'vouc-5', 'Tumbler VetBin', 'Koperasi Mahasiswa', 'Bagas R.', NULL, 500, '3 jam lalu', 'VETBIN-TMB-1123', '2026-11-09 01:45:00');

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;