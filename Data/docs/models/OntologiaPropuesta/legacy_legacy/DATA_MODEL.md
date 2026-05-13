# Data Model

Resumen general del modelo de datos para el cotizador de eventos corporativos en hotel.

## Entidades principales

- `CATEGORIAS`: agrupa items en familias funcionales/comerciales.
- `ITEM_CATALOGO`: entidad central del catalogo; representa un producto, servicio o politica cotizable.
- `PERFILES_PRECIO`: define como se calcula el precio de un item.
- `PERFILES_INICIALIZACION`: define con que cantidades o defaults entra un item a una cotizacion.
- `REGLAS_NEGOCIO`: restricciones, warnings y condiciones de aplicacion.
- `COMPOSICION_KIT`: extension futura para bundles o kits compuestos por varios items.

## Diagrama ER

```mermaid
erDiagram
    CATEGORIAS ||--o{ ITEM_CATALOGO : agrupa
    PERFILES_PRECIO ||--o{ ITEM_CATALOGO : calcula
    PERFILES_INICIALIZACION ||--o{ ITEM_CATALOGO : inicializa
    ITEM_CATALOGO ||--o{ REGLAS_NEGOCIO : aplica_scope_item
    CATEGORIAS ||--o{ REGLAS_NEGOCIO : aplica_scope_category
    ITEM_CATALOGO ||--o{ COMPOSICION_KIT : compone

    CATEGORIAS {
        string ID_Categoria
        string Nombre
        string Subcategoria
    }

    ITEM_CATALOGO {
        string ID_Item
        string Nombre
        string ID_Categoria
        string ID_Perfil_Precio
        string ID_Perfil_Init
    }

    PERFILES_PRECIO {
        string ID_Perfil_Precio
        number Costo_Base_Fijo
        number Costo_Unitario_Pax
        number Costo_Unitario_Item
        number Costo_Unitario_Tiempo
    }

    PERFILES_INICIALIZACION {
        string ID_Perfil_Init
        number Duracion_Min
        number Unidades_Por_Pax
        number Minutos_Por_Usuario
        number Cantidad_Fija
        number Pax_Fijo
    }

    REGLAS_NEGOCIO {
        string ID_Regla
        string Scope
        string Etapa
        string Tipo_Accion
        json Condicion_JSON
        json Payload_JSON
    }

    COMPOSICION_KIT {
        string ID_Kit
        string ID_Item_Hijo
        number Cantidad
    }
```

## Lectura rapida

- `ITEM_CATALOGO` es el nodo central del modelo.
- Cada item pertenece a una categoria.
- Cada item resuelve su precio a traves de un perfil reutilizable.
- Cada item puede tener un perfil de inicializacion para defaults de cantidad, pax o duracion.
- Las reglas pueden aplicar directamente al item o a toda una categoria, segun su `Scope`.

## Diagramas relacionados

- `DATA_CATEGORIZATION.drawio` - mapa visual de subcategorias, categorias fuente y ejemplos de items.
- `DATA_CATEGORIZATION.mup` - mapa mental MindMup con jerarquia correcta: subcategoria -> categoria fuente -> items.
