-- Se ejecuta automáticamente la PRIMERA vez que arranca el contenedor de MySQL (con el volumen vacío).
-- Además, el backend crea esta tabla (y le añade las columnas que falten) cada vez que arranca,
-- así que no hace falta borrar el volumen cuando cambia: ver prepararBaseDeDatos() en
-- src/repositories/empresas.repository.js

CREATE TABLE IF NOT EXISTS empresas (
  id               VARCHAR(30)  PRIMARY KEY,          -- id de OpenStreetMap, p. ej. "node/123456"
  nombre           VARCHAR(255) NOT NULL,
  lat              DECIMAL(9,6) NOT NULL,
  lng              DECIMAL(9,6) NOT NULL,
  sector           VARCHAR(100) NULL,
  localidad        VARCHAR(150) NULL,
  provincia        VARCHAR(100) NULL,
  cif              VARCHAR(9)   NULL,
  razon_social     VARCHAR(255) NULL,
  telefono         VARCHAR(50)  NULL,
  email            VARCHAR(255) NULL,
  web              VARCHAR(500) NULL,
  tamanyo          INT          NULL,
  decisor_nombre   VARCHAR(255) NULL,
  decisor_cargo    VARCHAR(150) NULL,
  decisor_email    VARCHAR(255) NULL,
  decisor_telefono VARCHAR(50)  NULL,
  estado           VARCHAR(20)  NOT NULL DEFAULT 'pendiente',  -- 'pendiente' | 'verificada' | 'no_apta'
  estado_cambiado_en DATETIME   NULL,
  analizada_en     DATETIME     NULL,                 -- cuándo se hizo el scraping (NULL = nunca)
  editada_en       DATETIME     NULL,                 -- última edición manual desde el registro (NULL = nunca)
  creada_en        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizada_en   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cif (cif)
);
