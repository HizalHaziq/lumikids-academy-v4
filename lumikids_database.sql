/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.14-MariaDB, for debian-linux-gnu (aarch64)
--
-- Host: 127.0.0.1    Database: lumikids
-- ------------------------------------------------------
-- Server version	10.11.14-MariaDB-0+deb12u2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `lumikids`
--

/*!40000 DROP DATABASE IF EXISTS `lumikids`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `lumikids` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `lumikids`;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `date` date NOT NULL,
  `status` enum('present','absent','late') NOT NULL DEFAULT 'present',
  `notes` varchar(255) DEFAULT NULL,
  `recorded_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_student_date` (`student_id`,`date`),
  KEY `class_id` (`class_id`),
  KEY `recorded_by` (`recorded_by`),
  KEY `idx_date` (`date`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `attendance_ibfk_3` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES
(1,1,2,'2026-05-08','present',NULL,3,'2026-05-10 11:50:37'),
(2,1,2,'2026-05-07','present',NULL,3,'2026-05-10 11:50:37'),
(3,1,2,'2026-05-06','absent',NULL,3,'2026-05-10 11:50:37'),
(4,1,2,'2026-05-05','present',NULL,3,'2026-05-10 11:50:37'),
(5,1,2,'2026-05-04','late',NULL,3,'2026-05-10 11:50:37'),
(6,1,2,'2026-05-01','present',NULL,3,'2026-05-10 11:50:37'),
(7,1,2,'2026-04-30','present',NULL,3,'2026-05-10 11:50:37'),
(8,1,2,'2026-04-29','absent',NULL,3,'2026-05-10 11:50:37'),
(9,1,2,'2026-04-28','present',NULL,3,'2026-05-10 11:50:37'),
(10,1,2,'2026-04-27','late',NULL,3,'2026-05-10 11:50:37'),
(11,2,1,'2026-05-08','present',NULL,2,'2026-05-10 11:50:37'),
(12,2,1,'2026-05-07','present',NULL,2,'2026-05-10 11:50:37'),
(13,2,1,'2026-05-06','absent',NULL,2,'2026-05-10 11:50:37'),
(14,2,1,'2026-05-05','present',NULL,2,'2026-05-10 11:50:37'),
(15,2,1,'2026-05-04','late',NULL,2,'2026-05-10 11:50:37'),
(16,2,1,'2026-05-01','present',NULL,2,'2026-05-10 11:50:37'),
(17,2,1,'2026-04-30','present',NULL,2,'2026-05-10 11:50:37'),
(18,2,1,'2026-04-29','absent',NULL,2,'2026-05-10 11:50:37'),
(19,2,1,'2026-04-28','present',NULL,2,'2026-05-10 11:50:37'),
(20,2,1,'2026-04-27','late',NULL,2,'2026-05-10 11:50:37'),
(21,3,2,'2026-05-08','present',NULL,3,'2026-05-10 11:50:37'),
(22,3,2,'2026-05-07','present',NULL,3,'2026-05-10 11:50:37'),
(23,3,2,'2026-05-06','absent',NULL,3,'2026-05-10 11:50:37'),
(24,3,2,'2026-05-05','present',NULL,3,'2026-05-10 11:50:37'),
(25,3,2,'2026-05-04','late',NULL,3,'2026-05-10 11:50:37'),
(26,3,2,'2026-05-01','present',NULL,3,'2026-05-10 11:50:37'),
(27,3,2,'2026-04-30','present',NULL,3,'2026-05-10 11:50:37'),
(28,3,2,'2026-04-29','absent',NULL,3,'2026-05-10 11:50:37'),
(29,3,2,'2026-04-28','present',NULL,3,'2026-05-10 11:50:37'),
(30,3,2,'2026-04-27','late',NULL,3,'2026-05-10 11:50:37'),
(31,2,1,'2026-05-10','present',NULL,2,'2026-05-10 11:59:49'),
(32,5,1,'2026-05-10','present',NULL,2,'2026-05-10 11:59:49');
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classes`
--

DROP TABLE IF EXISTS `classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `classes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `age_group` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `teacher_id` int(11) DEFAULT NULL,
  `capacity` int(11) DEFAULT 20,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `classes_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classes`
--

LOCK TABLES `classes` WRITE;
/*!40000 ALTER TABLE `classes` DISABLE KEYS */;
INSERT INTO `classes` VALUES
(1,'Sunshine Stars','3-4 years','Pre-K class focused on creative play and basic literacy.',2,15,'2026-05-10 11:50:37'),
(2,'Rainbow Explorers','4-5 years','Kindergarten class with structured learning activities.',3,18,'2026-05-10 11:50:37'),
(3,'Little Tots','2-3 years','Toddler class focused on social skills and motor development.',2,12,'2026-05-10 11:50:37');
/*!40000 ALTER TABLE `classes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enrollment_requests`
--

DROP TABLE IF EXISTS `enrollment_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `enrollment_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parent_name` varchar(150) NOT NULL,
  `parent_email` varchar(150) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `child_name` varchar(150) NOT NULL,
  `child_age` int(11) DEFAULT NULL,
  `preferred_class` varchar(120) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` datetime DEFAULT current_timestamp(),
  `processed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enrollment_requests`
--

LOCK TABLES `enrollment_requests` WRITE;
/*!40000 ALTER TABLE `enrollment_requests` DISABLE KEYS */;
INSERT INTO `enrollment_requests` VALUES
(1,'Jessica Taylor','jessica@example.com','+1-555-0301','Sophia Taylor',3,'Sunshine Stars','Sophia loves music and dance.','pending','2026-05-10 11:50:37',NULL),
(2,'TEST_Parent','test_parent_1778414384@example.com','555-0100','TEST_Child',4,'Sunshine Stars','automated test','pending','2026-05-10 11:59:44',NULL),
(3,'TEST_EnrollParent','test_enroll_1778414387@example.com','555-0200','TEST_EnrollChild',3,'Sunshine Stars',NULL,'approved','2026-05-10 11:59:47','2026-05-10 11:59:47'),
(4,'TEST_AutoParent','auto_1778414504@example.com','555-0123','TEST_AutoChild',4,'','','pending','2026-05-10 12:01:44',NULL);
/*!40000 ALTER TABLE `enrollment_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_pair` (`sender_id`,`receiver_id`),
  KEY `idx_receiver` (`receiver_id`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES
(1,3,4,'Hi Emma! Lily had a wonderful day today. She loved the painting activity!',1,'2026-05-10 11:50:37'),
(2,4,3,'Thank you so much! She\'s been talking about it all evening.',0,'2026-05-10 11:50:37'),
(3,5,2,'TEST_msg_1778414390',1,'2026-05-10 11:59:50'),
(4,4,3,'TEST_UIMsg_1778414566',0,'2026-05-10 12:02:46');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `title` varchar(200) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_read` (`user_id`,`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES
(1,1,'enrollment','New Enrollment Request','TEST_Parent requested enrollment for TEST_Child',1,'2026-05-10 11:59:44'),
(2,1,'enrollment','New Enrollment Request','TEST_EnrollParent requested enrollment for TEST_EnrollChild',1,'2026-05-10 11:59:47'),
(3,2,'message','New Message','New message from Michael Brown',0,'2026-05-10 11:59:50'),
(4,1,'enrollment','New Enrollment Request','TEST_AutoParent requested enrollment for TEST_AutoChild',0,'2026-05-10 12:01:44'),
(5,3,'message','New Message','New message from Emma Williams',0,'2026-05-10 12:02:46');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `age` int(11) DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `class_id` int(11) DEFAULT NULL,
  `photo_url` varchar(500) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `enrolled_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_parent` (`parent_id`),
  KEY `idx_class` (`class_id`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `students_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES
(1,'Lily Williams',4,'Female',4,2,NULL,NULL,'2026-05-10 11:50:37'),
(2,'Noah Brown',3,'Male',5,1,NULL,NULL,'2026-05-10 11:50:37'),
(3,'Olivia Smith',4,'Female',4,2,NULL,NULL,'2026-05-10 11:50:37'),
(5,'TEST_EnrollChild',3,NULL,7,1,NULL,NULL,'2026-05-10 11:59:47');
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','teacher','parent') NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'Administrator','admin@lumikids.com','$2b$12$mHrJZeB0VBEdJCRzgKAb1.2OBTARoPVc.hRsYpEOOeVGQL4HJzUMu','admin',NULL,NULL,'2026-05-10 11:50:36'),
(2,'Ms. Sarah Johnson','sarah@lumikids.com','$2b$12$3yfBjpKNT3f9YTQ7PsmVOeBN9ho18xAXYIcM4uJRNexVvd4UKIujq','teacher','+1-555-0101',NULL,'2026-05-10 11:50:37'),
(3,'Mr. David Chen','david@lumikids.com','$2b$12$yXooBmf7qtgxfht2VjWdeOIj3aaADYWyeXKXG1Asy80/Zcvx6.Jh6','teacher','+1-555-0102',NULL,'2026-05-10 11:50:37'),
(4,'Emma Williams','emma@example.com','$2b$12$nlyJguFX81ToRmeXUDLc0e8fdZkFBintrhyK5nTSvz89VeQLmhuf.','parent','+1-555-0201',NULL,'2026-05-10 11:50:37'),
(5,'Michael Brown','michael@example.com','$2b$12$N6C4I0OFZiZyKgmyxCskFuppw3c92pBFDPJsL590UacW3HA58/gr2','parent','+1-555-0202',NULL,'2026-05-10 11:50:37'),
(7,'TEST_EnrollParent','test_enroll_1778414387@example.com','$2b$12$znZTTgFkehc20AEhmGqp4eRK8phbZ4uQcrjJ/S79HeXEy5DGlJHUW','parent','555-0200',NULL,'2026-05-10 11:59:47'),
(8,'TEST_UIUser','uiuser_1778414518@example.com','$2b$12$j76zcJdZN.jzpD2HFUIni.BwmnWdFFBSopLzUxMWS1qY4.AlCPVfq','teacher','555-1010',NULL,'2026-05-10 12:01:58');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'lumikids'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-10 13:13:09
