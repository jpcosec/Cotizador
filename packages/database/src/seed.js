/**
 * Representative seed data for development and sandbox.
 * Mirrors the structure of the real production data.
 */

export const SEED_DATA = [
  {
    table: 'CLIENTES',
    records: [
      { ID_Cliente: 'C-001', Nombre_Empresa: 'Empresa Andina S.A.', RUT: '76.123.456-7', Email: 'eventos@andina.cl', Telefono: '+56 9 8765 4321' },
      { ID_Cliente: 'C-002', Nombre_Empresa: 'Corporación Pacífico', RUT: '77.987.654-3', Email: 'compras@pacifico.cl', Telefono: '+56 9 9876 5432' },
      { ID_Cliente: 'C-003', Nombre_Empresa: 'Inversiones Austral Ltda.', RUT: '96.555.111-2', Email: 'hola@austral.cl', Telefono: '+56 2 2345 6789' }
    ]
  },
  {
    table: 'PERFILES_PRECIO',
    records: [
      { ID_Perfil_Precio: 'PP-001', Nombre: 'Solo por Pax', Costo_Base_Fijo: 0, Costo_Unitario_Pax: 4600, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true },
      { ID_Perfil_Precio: 'PP-002', Nombre: 'Base Fija', Costo_Base_Fijo: 120000, Costo_Unitario_Pax: 0, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true },
      { ID_Perfil_Precio: 'PP-003', Nombre: 'Base + Pax', Costo_Base_Fijo: 50000, Costo_Unitario_Pax: 2500, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true },
      { ID_Perfil_Precio: 'PP-004', Nombre: 'Por Hora + Pax', Costo_Base_Fijo: 0, Costo_Unitario_Pax: 1800, Costo_Unitario_Tiempo: 8500, Costo_Unitario_Item: 0, Activo: true },
      { ID_Perfil_Precio: 'PP-005', Nombre: 'Por Unidad', Costo_Base_Fijo: 0, Costo_Unitario_Pax: 0, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 3200, Activo: true }
    ]
  },
  {
    table: 'CATEGORIAS',
    records: [
      { ID_Categoria: 'CAT-001', Nombre: 'Coffee Break', ID_Perfil_Precio_Default: 'PP-001', Def_Requiere_Pax: true, Def_Requiere_Cant: false, Def_Requiere_Tiempo: false, Def_Requiere_Hora: true, Def_Duracion_Min: 30, Def_Unidades_Por_Pax: 1, Icono_UI: 'coffee', Activo: true },
      { ID_Categoria: 'CAT-002', Nombre: 'Almuerzo / Cena', ID_Perfil_Precio_Default: 'PP-001', Def_Requiere_Pax: true, Def_Requiere_Cant: false, Def_Requiere_Tiempo: false, Def_Requiere_Hora: true, Def_Duracion_Min: 90, Def_Unidades_Por_Pax: 1, Icono_UI: 'utensils', Activo: true },
      { ID_Categoria: 'CAT-003', Nombre: 'Open Bar', ID_Perfil_Precio_Default: 'PP-004', Def_Requiere_Pax: true, Def_Requiere_Cant: false, Def_Requiere_Tiempo: true, Def_Requiere_Hora: true, Def_Duracion_Min: 120, Def_Unidades_Por_Pax: 1, Icono_UI: 'wine', Activo: true },
      { ID_Categoria: 'CAT-004', Nombre: 'Salón / Espacio', ID_Perfil_Precio_Default: 'PP-002', Def_Requiere_Pax: false, Def_Requiere_Cant: false, Def_Requiere_Tiempo: false, Def_Requiere_Hora: false, Def_Duracion_Min: null, Def_Unidades_Por_Pax: null, Icono_UI: 'building', Activo: true },
      { ID_Categoria: 'CAT-005', Nombre: 'Equipamiento', ID_Perfil_Precio_Default: 'PP-005', Def_Requiere_Pax: false, Def_Requiere_Cant: true, Def_Requiere_Tiempo: false, Def_Requiere_Hora: false, Def_Duracion_Min: null, Def_Unidades_Por_Pax: null, Icono_UI: 'monitor', Activo: true }
    ]
  },
  {
    table: 'ITEM_CATALOGO',
    records: [
      // Coffee Break
      { ID_Item: 'ITEM-001', Nombre: 'Coffee Break Estándar', ID_Categoria: 'CAT-001', ID_Perfil_Precio_Override: null, Def_Unidades_Por_Pax_Override: null, Default_Glosa: 'Coffee break con bebestibles calientes y snacks', Activo: true },
      { ID_Item: 'ITEM-002', Nombre: 'Coffee Break Premium', ID_Categoria: 'CAT-001', ID_Perfil_Precio_Override: 'PP-003', Def_Unidades_Por_Pax_Override: null, Default_Glosa: 'Coffee break premium con pastelería artesanal', Activo: true },
      // Almuerzo / Cena
      { ID_Item: 'ITEM-003', Nombre: 'Almuerzo Ejecutivo', ID_Categoria: 'CAT-002', ID_Perfil_Precio_Override: null, Def_Unidades_Por_Pax_Override: null, Default_Glosa: 'Almuerzo de 3 tiempos con entrada, fondo y postre', Activo: true },
      { ID_Item: 'ITEM-004', Nombre: 'Cena de Gala', ID_Categoria: 'CAT-002', ID_Perfil_Precio_Override: 'PP-003', Def_Unidades_Por_Pax_Override: null, Default_Glosa: 'Cena formal con menú de 5 tiempos', Activo: true },
      { ID_Item: 'ITEM-005', Nombre: 'Brunch Campestre', ID_Categoria: 'CAT-002', ID_Perfil_Precio_Override: null, Def_Unidades_Por_Pax_Override: null, Default_Glosa: 'Brunch con estaciones de comida', Activo: true },
      // Open Bar
      { ID_Item: 'ITEM-006', Nombre: 'Open Bar Clásico', ID_Categoria: 'CAT-003', ID_Perfil_Precio_Override: null, Def_Unidades_Por_Pax_Override: null, Default_Glosa: 'Bar abierto con variedad estándar', Activo: true },
      { ID_Item: 'ITEM-007', Nombre: 'Open Bar Premium', ID_Categoria: 'CAT-003', ID_Perfil_Precio_Override: 'PP-004', Def_Unidades_Por_Pax_Override: null, Default_Glosa: 'Bar premium con importados y cocteles especiales', Activo: true },
      // Salón
      { ID_Item: 'ITEM-008', Nombre: 'Salón Principal', ID_Categoria: 'CAT-004', ID_Perfil_Precio_Override: null, Def_Unidades_Por_Pax_Override: null, Default_Glosa: 'Salón principal con capacidad para 200 personas', Activo: true },
      { ID_Item: 'ITEM-009', Nombre: 'Terraza Exterior', ID_Categoria: 'CAT-004', ID_Perfil_Precio_Override: 'PP-002', Def_Unidades_Por_Pax_Override: null, Default_Glosa: 'Terraza al aire libre con vista panorámica', Activo: true },
      // Equipamiento
      { ID_Item: 'ITEM-010', Nombre: 'Proyector + Pantalla', ID_Categoria: 'CAT-005', ID_Perfil_Precio_Override: null, Def_Unidades_Por_Pax_Override: null, Default_Glosa: 'Proyector Full HD con pantalla de 3m', Activo: true },
      { ID_Item: 'ITEM-011', Nombre: 'Sistema de Sonido', ID_Categoria: 'CAT-005', ID_Perfil_Precio_Override: null, Def_Unidades_Por_Pax_Override: null, Default_Glosa: 'Sistema de sonido profesional con 2 micrófonos', Activo: true }
    ]
  },
  {
    table: 'REGLAS_NEGOCIO',
    records: [
      {
        ID_Regla: 'R-001',
        Nombre: 'Máximo 300 pax por evento',
        Etapa: 'RESTRICCION_UI',
        Scope: 'ITEM',
        Tipo_Accion: 'ERROR',
        Hook: null,
        Condicion_JSON: { '>': [{ var: 'pax' }, 300] },
        Payload_JSON: { message: 'Este ítem soporta máximo 300 pax.' },
        Prioridad: 10,
        Acumulable: false,
        Activo: true
      },
      {
        ID_Regla: 'R-002',
        Nombre: 'Open Bar solo en horario 18:00–02:00',
        Etapa: 'RESTRICCION_UI',
        Scope: 'ITEM',
        Tipo_Accion: 'WARNING',
        Hook: null,
        Condicion_JSON: { and: [{ '!==': [{ var: 'hora' }, ''] }, { or: [{ '<': [{ var: 'hora' }, '18:00'] }, { '>': [{ var: 'hora' }, '02:00'] }] }] },
        Payload_JSON: { message: 'El Open Bar está disponible a partir de las 18:00.' },
        Prioridad: 20,
        Acumulable: false,
        Activo: true
      }
    ]
  }
];
