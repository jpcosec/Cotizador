/**
 * Mappers for Item definitions.
 *
 * @module ItemMapper
 */

/**
 * Maps DB profile to Item pricing profile.
 * @param {Object} perfil
 * @returns {Object}
 */
export const mapPricingProfile = (perfil) => ({
  baseFijo: perfil?.Costo_Base_Fijo ?? 0,
  porPersona: perfil?.Costo_Unitario_Pax ?? 0,
  porMinuto: perfil?.Costo_Unitario_Tiempo ?? 0,
  porUnidad: perfil?.Costo_Unitario_Item ?? 0,
});

/**
 * Maps DB profileInit and category to Item default quantities.
 * @param {Object} pi
 * @param {Object} cat
 * @returns {Object}
 */
export const mapDefaultQuantities = (pi, cat) => ({
  duracionMin: pi?.Duracion_Min ?? 0,
  unidadesPorUsuario: pi?.Unidades_Por_Pax ?? 0,
  unidadesPorHora: pi?.Unidades_Por_Hora ?? 0,
  minutosPorUsuario: pi?.Minutos_Por_Usuario ?? 0,
  cantidad: pi?.Cantidad_Fija ?? 0,
  pax: pi?.Pax_Fijo ?? 0,
  requierePax: cat?.Def_Requiere_Pax ?? false,
  requiereCant: cat?.Def_Requiere_Cant ?? false,
  requiereTiempo: cat?.Def_Requiere_Tiempo ?? false,
  requiereHora: cat?.Def_Requiere_Hora ?? false,
});

/**
 * Maps full DB definition to internal Item definition.
 * @param {Object} def
 * @returns {Object}
 */
export const mapDefinition = (def) => ({
  id: def.ID_Item,
  name: def.Nombre,
  description: def.Default_Glosa ?? null,
  category: def.categoria?.Nombre ?? null,
  categoriaIcono: def.categoria?.Icono_UI ?? null,
  pricingProfile: mapPricingProfile(def.perfil),
  defaultQuantities: mapDefaultQuantities(def.perfilInit, def.categoria),
  rules: def.reglas ?? [],
  perfilInit: def.perfilInit ?? null,
  perfil: def.perfil ?? null,
  categoria: def.categoria ?? null,
  children: def.children ?? [],
});
