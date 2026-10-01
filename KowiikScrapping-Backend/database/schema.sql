CREATE TABLE empresas (
  id             VARCHAR(30)  PRIMARY KEY,
  nombre         VARCHAR(255) NOT NULL,
  lat            DECIMAL(9,6) NOT NULL,
  lng            DECIMAL(9,6) NOT NULL,
  sector         VARCHAR(100) NULL,
  telefono       VARCHAR(50)  NULL,
  email          VARCHAR(255) NULL,
  web            VARCHAR(500) NULL,
  creada_en      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizada_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE fichas (
  empresa_id        VARCHAR(30)  PRIMARY KEY,
  web_analizada     VARCHAR(500) NOT NULL,
  paginas_visitadas JSON         NOT NULL,
  analizada_en      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);