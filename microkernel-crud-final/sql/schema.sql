-- sql/schema.sql
-- Ejecutar en la base de datos configurada en .env (DB_NAME)

CREATE DATABASE IF NOT EXISTS microkernel_crud
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE microkernel_crud;

CREATE TABLE IF NOT EXISTS productos (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  nombre  VARCHAR(150) NOT NULL,
  precio  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  stock   INT NOT NULL DEFAULT 0,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
