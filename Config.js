/**
 * ============================================
 * CONFIGURACIÓN GLOBAL
 * Este archivo debe estar primero en el proyecto
 * ============================================
 */

const DB_CONFIG = {
  SHEET_ID: "1Fh3IddFyJwywCUCt01KVD1uGTySmQW8FYkq9XxYf_zU",
  TABLES: {
    CLIENTES: "CLIENTES",
    COTIZACIONES: "COTIZACIONES",
    DETALLE: "DETALLE_COTIZACION",
    ITEMS: "Items"
  }
};

// Alias para compatibilidad con código antiguo
const ID_PLANILLA = DB_CONFIG.SHEET_ID;