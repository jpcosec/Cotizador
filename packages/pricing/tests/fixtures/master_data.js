// Real data from: Precios empresas actualizado año 2025.xlsx
// Pricing formula: Neto = Base + (P × Cp) + (T × Ct) + (Q × Cq)

export const CLIENTS = [
  { ID_Cliente: 'CLI_CORP', Nombre_Empresa: 'Empresa Test Corp', RUT: '76.000.000-0', Email: 'corp@test.cl', Telefono: '+56912345678' },
  { ID_Cliente: 'CLI_WEDDING', Nombre_Empresa: 'Eventos Boda SpA', RUT: '76.111.111-1', Email: 'boda@test.cl', Telefono: '+56987654321' },
];

export const CATEGORIES = [
  {
    ID_Categoria: 'CAT_SALON', Nombre: 'Arriendo de salones',
    ID_Perfil_Precio_Default: 'PP_FIXED',
    Def_Requiere_Pax: false, Def_Requiere_Cant: false, Def_Requiere_Tiempo: true, Def_Requiere_Hora: true,
    Def_Duracion_Min: 480, Def_Unidades_Por_Pax: null,
    Activo: true,
  },
  {
    ID_Categoria: 'CAT_COFFEE', Nombre: 'Coffees y servicios de salón',
    ID_Perfil_Precio_Default: 'PP_PER_PAX_COFFEE_BASIC',
    Def_Requiere_Pax: true, Def_Requiere_Cant: false, Def_Requiere_Tiempo: false, Def_Requiere_Hora: false,
    Def_Duracion_Min: null, Def_Unidades_Por_Pax: null,
    Activo: true,
  },
  {
    ID_Categoria: 'CAT_FOOD', Nombre: 'Alimentación y banquetería',
    ID_Perfil_Precio_Default: 'PP_PER_PAX_ALMUERZO',
    Def_Requiere_Pax: true, Def_Requiere_Cant: false, Def_Requiere_Tiempo: false, Def_Requiere_Hora: true,
    Def_Duracion_Min: null, Def_Unidades_Por_Pax: null,
    Activo: true,
  },
  {
    ID_Categoria: 'CAT_FIESTA', Nombre: 'Servicios para fiestas',
    ID_Perfil_Precio_Default: 'PP_FIXED',
    Def_Requiere_Pax: false, Def_Requiere_Cant: false, Def_Requiere_Tiempo: false, Def_Requiere_Hora: true,
    Def_Duracion_Min: null, Def_Unidades_Por_Pax: null,
    Activo: true,
  },
  {
    ID_Categoria: 'CAT_BEBIDAS', Nombre: 'Bebidas y Bar',
    ID_Perfil_Precio_Default: 'PP_PER_UNIT_BEBIDA',
    Def_Requiere_Pax: true, Def_Requiere_Cant: true, Def_Requiere_Tiempo: false, Def_Requiere_Hora: false,
    Def_Duracion_Min: null, Def_Unidades_Por_Pax: 0.5,
    Activo: true,
  },
  {
    ID_Categoria: 'CAT_ACTIVIDAD', Nombre: 'Teambuilding y actividades',
    ID_Perfil_Precio_Default: 'PP_BASE_PLUS_PAX',
    Def_Requiere_Pax: true, Def_Requiere_Cant: false, Def_Requiere_Tiempo: false, Def_Requiere_Hora: false,
    Def_Duracion_Min: null, Def_Unidades_Por_Pax: null,
    Activo: true,
  },
  {
    ID_Categoria: 'CAT_AUDIO', Nombre: 'Técnica y audio',
    ID_Perfil_Precio_Default: 'PP_FIXED',
    Def_Requiere_Pax: false, Def_Requiere_Cant: false, Def_Requiere_Tiempo: false, Def_Requiere_Hora: false,
    Def_Duracion_Min: null, Def_Unidades_Por_Pax: null,
    Activo: true,
  },
];

export const PRICING_PROFILES = [
  // Fixed price (base only)
  { ID_Perfil_Precio: 'PP_FIXED', Nombre: 'Precio fijo', Costo_Base_Fijo: 0, Costo_Unitario_Pax: 0, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true },

  // Salones — each salon has its own fixed profile
  { ID_Perfil_Precio: 'PP_SALON_CHINOOK', Nombre: 'Salon Chinook diurno', Costo_Base_Fijo: 385000, Costo_Unitario_Pax: 0, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true },
  { ID_Perfil_Precio: 'PP_SALON_COHO', Nombre: 'Salon Coho diurno', Costo_Base_Fijo: 330000, Costo_Unitario_Pax: 0, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true },
  { ID_Perfil_Precio: 'PP_SALON_FARIO', Nombre: 'Salon Fario diurno', Costo_Base_Fijo: 242000, Costo_Unitario_Pax: 0, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true },
  { ID_Perfil_Precio: 'PP_SALON_ARCOIRIS', Nombre: 'Salon Arcoiris diurno', Costo_Base_Fijo: 209000, Costo_Unitario_Pax: 0, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true },
  { ID_Perfil_Precio: 'PP_SALON_DOMO', Nombre: 'Domo', Costo_Base_Fijo: 550000, Costo_Unitario_Pax: 0, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true },

  // Coffee per-pax profiles
  { ID_Perfil_Precio: 'PP_PER_PAX_COFFEE_BASIC', Nombre: 'Coffee Básico', Costo_Base_Fijo: 0, Costo_Unitario_Pax: 6380, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true },
  { ID_Perfil_Precio: 'PP_PER_PAX_COFFEE_INTER', Nombre: 'Coffee Intermedio', Costo_Base_Fijo: 0, Costo_Unitario_Pax: 10395, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true },
  { ID_Perfil_Precio: 'PP_PER_PAX_COFFEE_FULL', Nombre: 'Coffee Full', Costo_Base_Fijo: 0, Costo_Unitario_Pax: 16500, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true },

  // Food per-pax profiles
  { ID_Perfil_Precio: 'PP_PER_PAX_ALMUERZO', Nombre: 'Almuerzo buffet', Costo_Base_Fijo: 0, Costo_Unitario_Pax: 27311, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true },
  { ID_Perfil_Precio: 'PP_PER_PAX_CENA', Nombre: 'Cena buffet', Costo_Base_Fijo: 0, Costo_Unitario_Pax: 27311, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true },
  { ID_Perfil_Precio: 'PP_PER_PAX_COCKTAIL', Nombre: 'Cocktail básico', Costo_Base_Fijo: 0, Costo_Unitario_Pax: 13200, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true },

  // DJ fixed profiles
  { ID_Perfil_Precio: 'PP_DJ_SMALL', Nombre: 'DJ <50 pax', Costo_Base_Fijo: 850000, Costo_Unitario_Pax: 0, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true },
  { ID_Perfil_Precio: 'PP_DJ_LARGE', Nombre: 'DJ >50 pax', Costo_Base_Fijo: 1200000, Costo_Unitario_Pax: 0, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true },

  // Bebidas per-unit
  { ID_Perfil_Precio: 'PP_PER_UNIT_TICKET_TRAGO', Nombre: 'Ticket trago', Costo_Base_Fijo: 0, Costo_Unitario_Pax: 0, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 4850, Activo: true },
  { ID_Perfil_Precio: 'PP_PER_UNIT_TICKET_CERVEZA', Nombre: 'Ticket cerveza', Costo_Base_Fijo: 0, Costo_Unitario_Pax: 0, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 3529, Activo: true },
  { ID_Perfil_Precio: 'PP_PER_UNIT_BEBIDA', Nombre: 'Bebida genérica', Costo_Base_Fijo: 0, Costo_Unitario_Pax: 0, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 1933, Activo: true },

  // Activities: base + per-pax
  { ID_Perfil_Precio: 'PP_CAMINATA', Nombre: 'Caminata', Costo_Base_Fijo: 300000, Costo_Unitario_Pax: 10000, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true },
  { ID_Perfil_Precio: 'PP_PAINTBALL', Nombre: 'Paintball', Costo_Base_Fijo: 1000000, Costo_Unitario_Pax: 35000, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true },

  // Base + per-pax generic (category default for activities)
  { ID_Perfil_Precio: 'PP_BASE_PLUS_PAX', Nombre: 'Base + por persona', Costo_Base_Fijo: 0, Costo_Unitario_Pax: 0, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true },

  // Técnica audio
  { ID_Perfil_Precio: 'PP_TECNICA', Nombre: 'Técnica salones diurno', Costo_Base_Fijo: 165000, Costo_Unitario_Pax: 0, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true },
];

export const ITEMS = [
  // ── Salones ──
  { ID_Item: 'ITEM_CHINOOK', Nombre: 'Salon Chinook uso diurno (320 pers)', ID_Categoria: 'CAT_SALON', ID_Perfil_Precio_Override: 'PP_SALON_CHINOOK', Def_Unidades_Por_Pax_Override: null, Activo: true },
  { ID_Item: 'ITEM_COHO', Nombre: 'Salon Coho uso diurno (120 pers)', ID_Categoria: 'CAT_SALON', ID_Perfil_Precio_Override: 'PP_SALON_COHO', Def_Unidades_Por_Pax_Override: null, Activo: true },
  { ID_Item: 'ITEM_FARIO', Nombre: 'Salon Fario uso diurno (70 pers)', ID_Categoria: 'CAT_SALON', ID_Perfil_Precio_Override: 'PP_SALON_FARIO', Def_Unidades_Por_Pax_Override: null, Activo: true },
  { ID_Item: 'ITEM_ARCOIRIS', Nombre: 'Salon Arcoiris uso diurno (70 pers)', ID_Categoria: 'CAT_SALON', ID_Perfil_Precio_Override: 'PP_SALON_ARCOIRIS', Def_Unidades_Por_Pax_Override: null, Activo: true },
  { ID_Item: 'ITEM_DOMO', Nombre: 'Domo (240 pers)', ID_Categoria: 'CAT_SALON', ID_Perfil_Precio_Override: 'PP_SALON_DOMO', Def_Unidades_Por_Pax_Override: null, Activo: true },

  // ── Coffee ──
  { ID_Item: 'ITEM_COFFEE_BASIC', Nombre: 'Coffee Básico', ID_Categoria: 'CAT_COFFEE', ID_Perfil_Precio_Override: 'PP_PER_PAX_COFFEE_BASIC', Def_Unidades_Por_Pax_Override: null, Activo: true },
  { ID_Item: 'ITEM_COFFEE_INTER', Nombre: 'Coffee Intermedio', ID_Categoria: 'CAT_COFFEE', ID_Perfil_Precio_Override: 'PP_PER_PAX_COFFEE_INTER', Def_Unidades_Por_Pax_Override: null, Activo: true },
  { ID_Item: 'ITEM_COFFEE_FULL', Nombre: 'Coffee Full', ID_Categoria: 'CAT_COFFEE', ID_Perfil_Precio_Override: 'PP_PER_PAX_COFFEE_FULL', Def_Unidades_Por_Pax_Override: null, Activo: true },

  // ── Alimentación ──
  { ID_Item: 'ITEM_ALMUERZO', Nombre: 'Almuerzo buffet (>30 pax)', ID_Categoria: 'CAT_FOOD', ID_Perfil_Precio_Override: 'PP_PER_PAX_ALMUERZO', Def_Unidades_Por_Pax_Override: null, Activo: true },
  { ID_Item: 'ITEM_CENA', Nombre: 'Cena buffet (>30 pax)', ID_Categoria: 'CAT_FOOD', ID_Perfil_Precio_Override: 'PP_PER_PAX_CENA', Def_Unidades_Por_Pax_Override: null, Activo: true },
  { ID_Item: 'ITEM_COCKTAIL', Nombre: 'Cocktail básico (min 15)', ID_Categoria: 'CAT_FOOD', ID_Perfil_Precio_Override: 'PP_PER_PAX_COCKTAIL', Def_Unidades_Por_Pax_Override: null, Activo: true },

  // ── Fiestas / DJ ──
  { ID_Item: 'ITEM_DJ_SMALL', Nombre: 'DJ y/o Karaoke 4hrs <50 pax', ID_Categoria: 'CAT_FIESTA', ID_Perfil_Precio_Override: 'PP_DJ_SMALL', Def_Unidades_Por_Pax_Override: null, Activo: true },
  { ID_Item: 'ITEM_DJ_LARGE', Nombre: 'DJ y/o Karaoke 4hrs >50 pax', ID_Categoria: 'CAT_FIESTA', ID_Perfil_Precio_Override: 'PP_DJ_LARGE', Def_Unidades_Por_Pax_Override: null, Activo: true },

  // ── Bebidas ──
  { ID_Item: 'ITEM_TICKET_TRAGO', Nombre: 'Ticket de trago', ID_Categoria: 'CAT_BEBIDAS', ID_Perfil_Precio_Override: 'PP_PER_UNIT_TICKET_TRAGO', Def_Unidades_Por_Pax_Override: null, Activo: true },
  { ID_Item: 'ITEM_TICKET_CERVEZA', Nombre: 'Ticket de cerveza', ID_Categoria: 'CAT_BEBIDAS', ID_Perfil_Precio_Override: 'PP_PER_UNIT_TICKET_CERVEZA', Def_Unidades_Por_Pax_Override: 0.5, Activo: true },
  { ID_Item: 'ITEM_BEBIDA_LATA', Nombre: 'Bebida (lata)', ID_Categoria: 'CAT_BEBIDAS', ID_Perfil_Precio_Override: null, Def_Unidades_Por_Pax_Override: null, Activo: true },

  // ── Actividades ──
  { ID_Item: 'ITEM_CAMINATA', Nombre: 'Caminata la tenca 1.5hrs', ID_Categoria: 'CAT_ACTIVIDAD', ID_Perfil_Precio_Override: 'PP_CAMINATA', Def_Unidades_Por_Pax_Override: null, Activo: true },
  { ID_Item: 'ITEM_PAINTBALL', Nombre: 'Paintball', ID_Categoria: 'CAT_ACTIVIDAD', ID_Perfil_Precio_Override: 'PP_PAINTBALL', Def_Unidades_Por_Pax_Override: null, Activo: true },

  // ── Audio/Técnica ──
  { ID_Item: 'ITEM_TECNICA', Nombre: 'Técnica para salones uso diurno', ID_Categoria: 'CAT_AUDIO', ID_Perfil_Precio_Override: 'PP_TECNICA', Def_Unidades_Por_Pax_Override: null, Activo: true },

  // ── Pack (parent — no pricing profile) ──
  { ID_Item: 'PACK_COFFEE_COMPLETO', Nombre: 'Coffee Break Completo (pack)', ID_Categoria: 'CAT_COFFEE', ID_Perfil_Precio_Override: null, Def_Unidades_Por_Pax_Override: null, Activo: true },
];
