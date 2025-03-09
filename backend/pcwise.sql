-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 09, 2025 at 11:01 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pcwise`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `username`, `password`) VALUES
(1, 'admin', '$2b$10$a4pFwv56ar9lIQvhOH.eE.W50aXYmJvuajOCOL8F97o0xUeKezZPC');

-- --------------------------------------------------------

--
-- Table structure for table `brand`
--

CREATE TABLE `brand` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `image_path` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `brand`
--

INSERT INTO `brand` (`id`, `name`, `image_path`) VALUES
(3, 'MSI', '/uploads/1741444143690-key.png'),
(5, 'aa', '/uploads/1741504726976-banner1.jpg'),
(6, 'ss', '/uploads/1741505054679-banner3.jpg'),
(7, 'dddd', '/uploads/1741505719373-banner1.jpg'),
(8, 'segf', '/uploads/1741507687865-banner.jpg'),
(9, 'seg', '/uploads/1741507737598-banner3.jpg'),
(11, 'segseg', '/uploads/1741508643101-case.png'),
(12, 'segsegeee', '/uploads/1741508653773-default.jpg'),
(14, 'erherh', '/uploads/1741511183351-banner.jpg'),
(15, 'erherh', '/uploads/1741511196026-banner.jpg'),
(16, 'AKO', '/uploads/1741511229132-banner1.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `carousel_images`
--

CREATE TABLE `carousel_images` (
  `id` int(11) NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `carousel_images`
--

INSERT INTO `carousel_images` (`id`, `image_path`, `created_at`) VALUES
(11, '/uploads/1741497635637-banner3.jpg', '2025-03-09 05:20:35'),
(14, '/uploads/1741504396609-banner.jpg', '2025-03-09 07:13:16'),
(22, '/uploads/1741505457958-banner.jpg', '2025-03-09 07:30:57'),
(25, '/uploads/1741505683805-banner3.jpg', '2025-03-09 07:34:43');

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `quantity` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cart`
--

INSERT INTO `cart` (`id`, `product_id`, `user_id`, `name`, `price`, `quantity`) VALUES
(29, 24, 1, 'VICTUS', 10000.00, 1),
(34, 23, 1, 'VICTUS', 10000.00, 1),
(42, 25, 6, 'Juben G Soliven', 1020.00, 1),
(43, 24, 6, 'VICTUS', 10000.00, 8);

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE `category` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `image_path` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`id`, `name`, `image_path`) VALUES
(1, 'PROCESSO', '/uploads/1741192566254-purepng.com-cpu-processorelectronicscpuprocessor-941524672527kysg5.png'),
(4, 'MEMORY', '/uploads/1741193304893-RAM.png'),
(5, 'SOLID STATE DRIVES', '/uploads/1741193343038-ssd.png'),
(6, 'POWER SUPPLY', '/uploads/1741193379044-psu.png'),
(7, 'PC CASE1', '/uploads/1741193562004-case.png'),
(8, 'MONITOR', '/uploads/1741193670764-monitor.png'),
(9, 'KEYBOARDs', '/uploads/1741193831676-key.png'),
(10, 'MOUSE', '/uploads/1741193877011-mouse.png'),
(11, 'HEADSET', '/uploads/1741193905564-head.png'),
(13, 'LAPTOPS', '/uploads/1741433725277-laptop.png'),
(20, 'ddd', '/uploads/1741508358788-banner1.jpg'),
(21, 'dfgbdg', '/uploads/1741508393271-gpu.png'),
(22, 'drgdrg111', '/uploads/1741508406217-banner1.jpg'),
(23, 'sgdg', '/uploads/1741508441161-default.jpg'),
(24, 'agaesg', '/uploads/1741508548823-banner1.jpg'),
(25, 'segsegseg', '/uploads/1741508577469-gpu.png'),
(26, 'segseg', '/uploads/1741508561129-banner.jpg'),
(27, 'segseg', '/uploads/1741508566658-banner.jpg'),
(28, 'drhrdh', '/uploads/1741509461647-banner1.jpg'),
(29, 'egsgseee', '/uploads/1741510618185-banner.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `description` text NOT NULL,
  `brand_id` int(11) DEFAULT NULL,
  `stock` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `price`, `category_id`, `description`, `brand_id`, `stock`) VALUES
(23, 'VICTUS', 10000.00, 1, 'AAA', 3, 0),
(24, 'VICTUS', 10000.00, 1, 'AAA', NULL, 8),
(25, 'Juben G Soliven', 1020.00, 1, 'AAA', NULL, 1),
(26, 'Juben Azley G Soliven', 10000.00, 1, 'awafwf', 3, 0),
(27, 'Cherry Mobile', 10000.00, 1, 'AAA', 6, 0),
(28, 'Cherry Mobile', 10000.00, 1, 'AAA', 5, 0),
(29, 'Cherry Mobilezxc', 10000.00, 1, 'AAA', 5, 11);

-- --------------------------------------------------------

--
-- Table structure for table `product_images`
--

CREATE TABLE `product_images` (
  `id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `image_path` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_images`
--

INSERT INTO `product_images` (`id`, `product_id`, `image_path`) VALUES
(23, 24, '/uploads/1741484903840-banner1.jpg'),
(24, 25, '/uploads/1741485972121-default.jpg'),
(25, 25, '/uploads/1741485972122-case.png'),
(26, 25, '/uploads/1741486070489-default.jpg'),
(27, 25, '/uploads/1741486070490-banner3.jpg'),
(28, 25, '/uploads/1741486070491-key.png'),
(29, 25, '/uploads/1741486070504-RAM.png'),
(30, 23, '/uploads/1741511644915-gpu.png'),
(31, 23, '/uploads/1741511653979-default.jpg'),
(32, 23, '/uploads/1741512413105-case.png'),
(33, 26, '/uploads/1741512613515-default.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `created_at`) VALUES
(1, 'qwe', '$2b$10$7egnnFZ5zGRfI4Xc.SSRJ.zO7zkqIO89A4ctXzK6X2Vkzsgu4D2lu', '2025-02-10 02:43:22'),
(4, 'qwe12', '$2b$10$OVR68gD9gzurnoYaFTgkzetaZZpkEBg71fpFcQ3enObmb8IWx2S8O', '2025-02-10 04:39:26'),
(5, 'asd', '$2b$10$H7nJKfx24mFGkXHOlJhIV.f7XYkGl0wUyEb.E6348YgYW1uM6vgqC', '2025-02-10 06:09:42'),
(6, 'j6025596@gmail.com', '$2b$10$GwM8ZG6bJML9lOiga1GVGuO5vN1U5mSNPHi0avpyjgCdTjPUo/kzi', '2025-03-08 17:16:05');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `brand`
--
ALTER TABLE `brand`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `carousel_images`
--
ALTER TABLE `carousel_images`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `fk_brand` (`brand_id`);

--
-- Indexes for table `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `brand`
--
ALTER TABLE `brand`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `carousel_images`
--
ALTER TABLE `carousel_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `product_images`
--
ALTER TABLE `product_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart`
--
ALTER TABLE `cart`
  ADD CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_brand` FOREIGN KEY (`brand_id`) REFERENCES `brand` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`);

--
-- Constraints for table `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
