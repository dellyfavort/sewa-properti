-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 08, 2026 at 06:43 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sewa_properti`
--

-- --------------------------------------------------------

--
-- Table structure for table `kontrak`
--

CREATE TABLE `kontrak` (
  `id_kontrak` int(11) NOT NULL,
  `id_properti` int(11) DEFAULT NULL,
  `id_tenant` int(11) DEFAULT NULL,
  `tanggal_mulai` date DEFAULT NULL,
  `tanggal_selesai` date DEFAULT NULL,
  `total_nilai_kontrak` decimal(12,2) NOT NULL,
  `status_kontrak` enum('aktif','selesai','dibatalkan') NOT NULL DEFAULT 'aktif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `kontrak`
--

INSERT INTO `kontrak` (`id_kontrak`, `id_properti`, `id_tenant`, `tanggal_mulai`, `tanggal_selesai`, `total_nilai_kontrak`, `status_kontrak`) VALUES
(4, 2, 13, '2026-05-01', '2026-05-31', 150000000.00, 'aktif'),
(5, 3, 11, '2026-05-10', '2026-06-09', 240000000.00, 'aktif'),
(8, 8, 11, '2026-06-01', '2026-07-01', 45000000.00, 'aktif'),
(9, 7, 13, '2026-06-01', '2026-07-10', 123500000.00, 'dibatalkan'),
(10, 12, 14, '2026-06-01', '2026-07-01', 25000000.00, 'aktif');

-- --------------------------------------------------------

--
-- Table structure for table `pembayaran`
--

CREATE TABLE `pembayaran` (
  `id_pembayaran` int(11) NOT NULL,
  `id_kontrak` int(11) DEFAULT NULL,
  `tanggal_bayar` date DEFAULT NULL,
  `tanggal_jatuh_tempo` date NOT NULL,
  `jumlah_tagihan` decimal(12,2) DEFAULT NULL,
  `jumlah_dibayar` decimal(12,2) NOT NULL,
  `status_bayar` enum('menunggu','terverifikasi','ditolak') NOT NULL DEFAULT 'menunggu',
  `bukti_bayar` varchar(255) DEFAULT NULL,
  `catatan` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pembayaran`
--

INSERT INTO `pembayaran` (`id_pembayaran`, `id_kontrak`, `tanggal_bayar`, `tanggal_jatuh_tempo`, `jumlah_tagihan`, `jumlah_dibayar`, `status_bayar`, `bukti_bayar`, `catatan`) VALUES
(2, 4, '2026-06-05', '2026-05-01', 150000000.00, 0.00, 'menunggu', NULL, ''),
(3, 5, '2026-05-20', '2026-05-10', 240000000.00, 240000000.00, 'terverifikasi', 'PAY-1779239494942.png', 'Pembayaran lunas tinggal mengecek pembayaran bank di manager'),
(6, 8, NULL, '2026-06-01', 45000000.00, 0.00, 'menunggu', NULL, NULL),
(7, 9, NULL, '2026-06-01', 123500000.00, 0.00, 'ditolak', NULL, 'Sistem: Kontrak ini telah dibatalkan.'),
(8, 10, '2026-06-05', '2026-06-01', 25000000.00, 12000000.00, 'menunggu', 'PAY-1780662256496.png', 'Pembayaran dilakukan secara mencicil');

-- --------------------------------------------------------

--
-- Table structure for table `pengajuan_sewa`
--

CREATE TABLE `pengajuan_sewa` (
  `id_ajukan` int(11) NOT NULL,
  `id_properti` int(11) NOT NULL,
  `id_tenant` int(11) NOT NULL,
  `status` enum('menunggu','disetujui','ditolak') DEFAULT 'menunggu'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pengajuan_sewa`
--

INSERT INTO `pengajuan_sewa` (`id_ajukan`, `id_properti`, `id_tenant`, `status`) VALUES
(6, 4, 14, 'ditolak'),
(7, 4, 14, 'menunggu'),
(8, 8, 11, 'menunggu'),
(9, 12, 14, 'menunggu');

-- --------------------------------------------------------

--
-- Table structure for table `properti`
--

CREATE TABLE `properti` (
  `id_properti` int(11) NOT NULL,
  `kode_properti` varchar(50) DEFAULT NULL,
  `nama_properti` varchar(100) DEFAULT NULL,
  `tipe_properti` varchar(50) NOT NULL,
  `alamat` text NOT NULL,
  `hargasewa_standar` decimal(12,2) DEFAULT NULL,
  `status_properti` enum('tersedia','tersewa','perbaikan') NOT NULL DEFAULT 'tersedia',
  `gambar_properti` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `properti`
--

INSERT INTO `properti` (`id_properti`, `kode_properti`, `nama_properti`, `tipe_properti`, `alamat`, `hargasewa_standar`, `status_properti`, `gambar_properti`) VALUES
(1, 'R002', 'Ruko Artha Gading Blok B', 'Ruko', 'Jalan Jakarta Barat', 10000000.00, 'tersedia', 'default.jpg'),
(2, 'R001', 'Blue Ocean Square', 'Ruko', 'Jl. Boulevard Raya No. 12, Kelapa Gading, Jakarta Utara, 14240', 150000000.00, 'tersewa', 'PROP-1778630954203.png'),
(3, 'OFC-0901', 'Graha Pelita Utama', 'Kantor', 'Jl. Jenderal Sudirman Kav. 21, Karet Tengsin, Jakarta Pusat', 240000000.00, 'tersewa', 'PROP-1778630871750.png'),
(4, 'RMH-PI-01', 'Villa Pondok Indah Kencana', 'Rumah', 'Jl. Metro Pondok Indah Blok UA No. 12, Kebayoran Lama, Jakarta Selatan', 85000000.00, 'tersedia', 'PROP-1777645494482.png'),
(5, 'APT-PKW-02', 'Anderson Mansion Pakuwon', 'Apartemen', 'Pakuwon Mall Tower A, Jl. Puncak Indah Lontar No. 2, Surabaya Barat', 12500000.00, 'tersedia', 'PROP-1777645703802.png'),
(6, 'KNT-SCBD-03', 'Equity Tower Executive Suite', 'Kantor', 'SCBD Lot 9, Jl. Jenderal Sudirman Kav. 52, Senayan, Jakarta Selatan', 320000000.00, 'tersedia', 'PROP-1777645994487.png'),
(7, 'GDG-SMG-04', 'Candi Industrial Warehouse', 'Gudang', 'Kawasan Industri Candi Blok XI, Ngaliyan, Kota Semarang', 95000000.00, 'tersedia', 'PROP-1777646110349.png'),
(8, 'RMH-BAL-05', 'Canggu Tropical Sanctuary', 'Rumah', 'Jl. Pantai Batu Bolong No. 45, Kuta Utara, Badung, Bali', 45000000.00, 'tersewa', 'PROP-1777646265019.png'),
(9, 'APT-BSD-06', 'Branz BSD Sky Luxury', 'Apartemen', 'Jl. BSD Boulevard Kav. 55, Pagedangan, Tangerang', 18500000.00, 'tersedia', 'PROP-1777646508515.png'),
(10, 'KNT-BDG-07', 'Dago Creative Hub Office', 'Kantor', 'Jl. Ir. H. Juanda No. 120, Coblong, Kota Bandung', 55000000.00, 'tersedia', 'PROP-1777646616143.png'),
(11, 'GDG-8059', 'Gudang Banyuanyar', 'Gudang', 'Jl. Adi Sumarmo, Banyuanyar, Banjarsari, Surakarta', 5000000.00, 'tersedia', 'PROP-1779711408583.png'),
(12, 'GDG-4086', 'Grogol Prime Industrial Park', 'Gudang', 'Jl. Ir. Soekarno Solo Baru, Kec. Grogol, Kab. Sukoharjo, Jawa Tengah.', 25000000.00, 'tersewa', 'PROP-1779712017418.png'),
(13, 'APT-5184', 'SENTRALAND SEMARANG LUXURY', 'Apartemen', 'Jl. Ki Mangunsarkoro No.36, Semarang Tengah', 7500000.00, 'tersedia', 'PROP-1779712684837.png'),
(14, 'R-8376', 'Kompleks Ruko Permata Margonda', 'Ruko', 'Jl. Margonda Raya No. 120,\r\nKel. Pondok Sanggrai, Kec. Beji,\r\nKota Depok, Jawa Barat 16424.', 20000000.00, 'tersedia', 'PROP-1780656574755.png'),
(15, 'RMH-4850', 'Perumahan Kencana Indah', 'Rumah', 'Jalan Merak Merah, Jakarta', 35000000.00, 'tersedia', 'PROP-1780661121753.png');

-- --------------------------------------------------------

--
-- Table structure for table `tenant`
--

CREATE TABLE `tenant` (
  `id_tenant` int(11) NOT NULL,
  `kode_tenant` varchar(50) DEFAULT NULL,
  `nama_lengkap` varchar(100) NOT NULL,
  `no_ktp` varchar(20) NOT NULL,
  `telepon` varchar(20) NOT NULL,
  `alamat_domisili` text NOT NULL,
  `status_verifikasi` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tenant`
--

INSERT INTO `tenant` (`id_tenant`, `kode_tenant`, `nama_lengkap`, `no_ktp`, `telepon`, `alamat_domisili`, `status_verifikasi`) VALUES
(11, 'TNT-235642', 'Pino', '3326160608070181', '0893663636820', 'Jalan Mawar RT 03 RW 13, Jakarta Utara 57230', 'verified'),
(13, 'TNT-054108', 'Doni', '3326160608070162', '0814298747492', 'Jalan Merdeka 100 Jakarta', 'verified'),
(14, 'TNT-636179', 'Reni', '3326160608070176', '08975433488273', 'Jalan Mawar, Jakarta Barat ', 'verified');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id_user` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','manager','tenant') NOT NULL,
  `id_tenant` int(11) DEFAULT NULL,
  `telepon_pengelola` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id_user`, `email`, `password_hash`, `role`, `id_tenant`, `telepon_pengelola`, `created_at`) VALUES
(4, 'sunny@gmail.com', '$2b$10$DP5sanm79BSW6qvJl5VV6ueHNfIaOYSdHDrWDuVLf9jpaqLc11gL.', 'manager', NULL, '0814298747899', '2026-04-29 15:42:39'),
(14, 'pino@gmail.com', '$2b$10$CQuop2JyPhu86JbH6igGKeGaygmtQSSEqfih4iduTmG7kgnutJ8TG', 'tenant', 11, NULL, '2026-04-30 15:50:35'),
(17, 'doni@gmail.com', '$2b$10$0ssawIriWhaT6vHdKgbvLeK5CxT/N5t2yGv5TQbSCbXaR4c4chJwC', 'tenant', 13, NULL, '2026-05-06 01:30:54'),
(18, 'anissa@gmail.com', '$2b$10$lWpaNG4EzpvwsHAWfLpzNelaov8Yqic/r/RCaCkyQkx.zUQvXI4LO', 'admin', NULL, '089675433469', '2026-05-06 15:18:48'),
(19, 'reni@gmail.com', '$2b$10$PxKd9SlHN6cxdrmgEHoLM.DulMCh1qlGCfMVfaakvAa0gvtcLSNIq', 'tenant', 14, NULL, '2026-05-27 12:40:36'),
(20, 'veronica@gmail.com', '$2b$10$O07xppRPvEFW0wzp6YLFyeKvgUqd9jN6bczrBI823ZbVByeucc.4S', 'admin', NULL, '0814298747480', '2026-06-08 16:42:14');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `kontrak`
--
ALTER TABLE `kontrak`
  ADD PRIMARY KEY (`id_kontrak`),
  ADD KEY `id_properti` (`id_properti`),
  ADD KEY `id_tenant` (`id_tenant`);

--
-- Indexes for table `pembayaran`
--
ALTER TABLE `pembayaran`
  ADD PRIMARY KEY (`id_pembayaran`),
  ADD KEY `id_kontrak` (`id_kontrak`);

--
-- Indexes for table `pengajuan_sewa`
--
ALTER TABLE `pengajuan_sewa`
  ADD PRIMARY KEY (`id_ajukan`),
  ADD KEY `id_properti` (`id_properti`),
  ADD KEY `id_tenant` (`id_tenant`);

--
-- Indexes for table `properti`
--
ALTER TABLE `properti`
  ADD PRIMARY KEY (`id_properti`);

--
-- Indexes for table `tenant`
--
ALTER TABLE `tenant`
  ADD PRIMARY KEY (`id_tenant`),
  ADD UNIQUE KEY `kode_tenant` (`kode_tenant`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id_user`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `id_tenant` (`id_tenant`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `kontrak`
--
ALTER TABLE `kontrak`
  MODIFY `id_kontrak` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `pembayaran`
--
ALTER TABLE `pembayaran`
  MODIFY `id_pembayaran` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `pengajuan_sewa`
--
ALTER TABLE `pengajuan_sewa`
  MODIFY `id_ajukan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `properti`
--
ALTER TABLE `properti`
  MODIFY `id_properti` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `tenant`
--
ALTER TABLE `tenant`
  MODIFY `id_tenant` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id_user` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `kontrak`
--
ALTER TABLE `kontrak`
  ADD CONSTRAINT `kontrak_ibfk_1` FOREIGN KEY (`id_properti`) REFERENCES `properti` (`id_properti`),
  ADD CONSTRAINT `kontrak_ibfk_2` FOREIGN KEY (`id_tenant`) REFERENCES `tenant` (`id_tenant`);

--
-- Constraints for table `pembayaran`
--
ALTER TABLE `pembayaran`
  ADD CONSTRAINT `pembayaran_ibfk_1` FOREIGN KEY (`id_kontrak`) REFERENCES `kontrak` (`id_kontrak`);

--
-- Constraints for table `pengajuan_sewa`
--
ALTER TABLE `pengajuan_sewa`
  ADD CONSTRAINT `pengajuan_sewa_ibfk_1` FOREIGN KEY (`id_properti`) REFERENCES `properti` (`id_properti`) ON DELETE CASCADE,
  ADD CONSTRAINT `pengajuan_sewa_ibfk_2` FOREIGN KEY (`id_tenant`) REFERENCES `tenant` (`id_tenant`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`id_tenant`) REFERENCES `tenant` (`id_tenant`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
