# ItemComponent - Professional Item Configurator

> A production-grade, reusable item configurator component for event pricing systems.  
> Self-contained, elegant, and designed for luxury event management interfaces.

## Overview

**ItemComponent** is a standalone Alpine.js module that provides a complete item configuration experience with:

- 📦 **Self-contained module** - Drop it into any Alpine.js app
- 🎨 **Professional luxury aesthetics** - Refined minimalism with warm gold accents
- ⚡ **Zero external dependencies** - Only requires Alpine.js
- 📊 **Real-time pricing** - Automatic calculations on every change
- 🎯 **Rule engine integration** - JSON-Logic business rules evaluation
- 👤 **User override tracking** - Marks manually-set vs auto-calculated values

## Design Aesthetic

**"Professional Luxury Minimalism"**

- **Typography**: Playfair Display (serif display) + Outfit (clean sans-serif body)
- **Colors**: Deep Navy + Warm Gold + Clean Whites
- **Spacing**: Generous whitespace, card-based layout
- **Motion**: Smooth transitions (300ms cubic-bezier), reveal animations
- **Philosophy**: Form follows function, every detail intentional

The component feels like Airbnb meets luxury hotel booking software – professional, trustworthy, and beautiful.

## Installation

### 1. Copy Files to Your Project

```bash
# Copy the complete component
cp ItemComponent.js your-project/components/
cp ItemComponent.html your-project/components/
cp Item.js your-project/components/           # Core business logic
cp Item.test.js your-project/components/test/ # Tests
cp domain/ your-project/components/           # All domain modules
```

### 2. Import into Your Application

```javascript
// In your main app or Alpine initialization file
import { ItemComponent } from './components/ItemComponent.js';

// Make it global for Alpine
window.ItemComponent = ItemComponent;
```

### 3. Use in Your HTML

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/alpinejs@3.12.0/dist/cdn.min.js" defer></script>
  <script type="module" src="./app.js"></script>
</head>
<body>
  <!-- Include the ItemComponent template -->
  <div id="app"></div>
  
  <script>
    // Load and mount the component
    fetch('./ItemComponent.html')
      .then(r => r.text())
      .then(html => {
        document.getElementById('app').innerHTML = html;
        Alpine.start();
      });
  </script>
</body>
</html>
```

## Usage

### Basic Usage

```javascript
// Define an item
const itemDefinition = {
  id: 'ITEM_001',
  name: 'Plated Dinner',
  description: 'Multi-course gourmet plated dinner',
  category: 'Catering',
  pricingProfile: {
    baseFijo: 0,           // Base fixed price
    porPersona: 85000,     // Price per person (CLP)
    porUnidad: 0,
    porMinuto: 0
  },
  defaultQuantities: {
    unidadesPorUsuario: 1  // Default: 1 unit per person
  },
  rules: []               // JSON-Logic business rules
};

// Create the component
const component = ItemComponent.create(itemDefinition, {
  paxGlobal: 100,        // Event context
  duracionMin: 180,
  hora: '19:00',
  dia: '2026-02-28'
});

// Now use it in Alpine.js:
// <div x-data="component" x-init="init()">
//   <!-- Template -->
// </div>
```

### Advanced: With Business Rules

```javascript
const itemWithRules = {
  id: 'ITEM_002',
  name: 'Premium Bar Service',
  category: 'Beverages',
  pricingProfile: {
    baseFijo: 500000,      // Base service charge
    porPersona: 15000,     // Per-person bar fee
    porUnidad: 0,
    porMinuto: 0
  },
  rules: [
    {
      ID_Regla: 'RULE_001',
      Nombre: 'Maximum 200 guests',
      Tipo_Accion: 'ERROR',
      Condicion_JSON: { '>': [{ 'var': 'pax' }, 200] },
      Scope: 'ITEM',
      Activo: true
    },
    {
      ID_Regla: 'RULE_002',
      Nombre: 'Warning: Large events',
      Tipo_Accion: 'WARNING',
      Condicion_JSON: { '>=': [{ 'var': 'pax' }, 150] },
      Scope: 'ITEM',
      Activo: true
    }
  ]
};
```

## Component API

### Factory Method

```javascript
ItemComponent.create(definition, context) → Object
```

Returns an Alpine.js data object with all component state and methods.

**Parameters:**
- `definition` (Object) - Item definition with name, pricing, rules
- `context` (Object) - Optional external event context

### Methods

#### Mode Control

```javascript
setMode(mode)           // Switch between 'catalog' and 'basket'
addToBasket()           // Switch to basket mode
removeFromBasket()      // Return to catalog mode
```

#### Context & Overrides

```javascript
setContext(key, value)           // Update event context (paxGlobal, duracionMin, etc.)
setOverride(key, value)          // Override quantity (pax, cantidad, duracionMin)
clearOverride(key)               // Remove single override
resetOverrides()                 // Reset all overrides
```

#### Pricing Configuration

```javascript
setProfileValue(key, value)      // Update pricing profile (baseFijo, porPersona, etc.)
setDefaultQuantity(key, value)   // Update default quantities
```

#### Rules

```javascript
addRule()                        // Add new rule from form
removeRule(idx)                  // Delete rule by index
toggleRuleActive(idx)            // Enable/disable rule
toggleAddRuleForm()              // Show/hide rule form
toggleRuleExpanded(idx)          // Expand rule details
```

#### Formatting

```javascript
humanizeCondition(condition)     // Convert JSON-Logic to readable text
renderConditionTree(condition)   // Generate syntax-highlighted HTML
formatConditionPreview(condition) // Truncate for preview display
```

#### Data Export

```javascript
toJSON()                         // Export complete component state
```

### Getters

```javascript
// Read-only access to component state
component.rules                  // Array of business rules
component.definition             // Item definition
component.externalContext        // Event context
component.overrides              // User-set overrides
component.profile                // Pricing profile
component.total                  // Calculated total price
component.state                  // Full display object
component.mode                   // Current mode ('catalog' or 'basket')
```

## State Object

The component exposes a `state` object with all computed values:

```javascript
{
  // Configuration
  mode: 'catalog' | 'basket',
  definition: { /* item definition */ },
  externalContext: { /* event context */ },
  overrides: { /* user-set values */ },
  
  // Computed Values
  profile: { /* pricing profile */ },
  quantities: { pax, cantidad, duracionMin },
  schedule: { dia, hora },
  
  // Pricing
  total: 85000,              // Total price
  lineRateLabel: 'Per Person',
  lineRateValue: 85000,
  lineRateSubtotal: 8500000,
  unitDisplay: 85000,
  
  // Display Strings
  catalogFormulaHuman: 'CLP 85,000 per person',
  initPolicyHuman: 'Minimum 1 guest',
  basketLegend: 'CLP 85,000 × 100 guests = CLP 8,500,000',
  
  // User Override Tracking
  userSetFields: ['pax'],
  isUserSetPax: true,
  isUserSetCantidad: false,
  isUserSetDuracion: false,
  isOverridden: true,
  
  // Rules
  appliedRules: [],
  ruleErrors: [],
  ruleWarnings: [],
  available: true,
  
  // UI Flags
  showPaxControl: true,
  showUnitsControl: false,
  showTimeControl: false,
  comentarios: ''
}
```

## Styling & Customization

### CSS Variables

All colors and spacing use CSS variables. Override them in your app:

```css
:root {
  /* Colors */
  --color-navy: #1a1f3a;
  --color-gold: #d4af37;
  --color-white: #fafafa;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  
  /* Typography */
  --font-display: 'Playfair Display', serif;
  --font-body: 'Outfit', sans-serif;
  --font-mono: 'Courier New', monospace;
  
  /* Spacing */
  --sp-xs: 4px;
  --sp-sm: 8px;
  --sp-md: 16px;
  --sp-lg: 24px;
  --sp-xl: 32px;
  
  /* Transitions */
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Responsive Behavior

The component is fully responsive:
- **Desktop (1024px+)**: 3-column layout (config | item | rules)
- **Tablet (640px-1024px)**: 1-column stacked layout
- **Mobile (<640px)**: Single column, touch-friendly controls

## Events & Integration

The component works with Alpine.js's standard event system:

```html
<div x-data="ItemComponent.create(definition)">
  <!-- Alpine directives work naturally -->
  <button @click="setMode('basket')">Go to Basket</button>
  
  <!-- Watch computed values -->
  <span x-text="'Total: $' + state.total"></span>
  
  <!-- Bind to form inputs -->
  <input :value="state.quantities.pax" @change="setOverride('pax', $event.target.value)">
</div>
```

## Examples

### Example 1: Simple Catering Item

```javascript
const platedDinner = {
  name: 'Plated Dinner',
  category: 'Catering',
  pricingProfile: { baseFijo: 0, porPersona: 85000 },
  defaultQuantities: { unidadesPorUsuario: 1 }
};

const component = ItemComponent.create(platedDinner, {
  paxGlobal: 100,
  duracionMin: 180,
  hora: '19:00'
});
```

### Example 2: Item with Time-Based Pricing

```javascript
const danceFloor = {
  name: 'Premium Dance Floor',
  category: 'Venue',
  pricingProfile: {
    baseFijo: 2000000,   // Setup + cleanup
    porMinuto: 5000      // Hourly rental
  },
  defaultQuantities: {
    unidadesPorHora: 60  // 1 unit per hour
  }
};
```

### Example 3: Item with Business Rules

```javascript
const exclusiveWine = {
  name: 'Exclusive Wine Selection',
  category: 'Beverages',
  pricingProfile: { baseFijo: 1000000, porPersona: 50000 },
  rules: [
    {
      ID_Regla: 'MIN_GUESTS',
      Nombre: 'Minimum 50 guests',
      Tipo_Accion: 'ERROR',
      Condicion_JSON: { '<': [{ 'var': 'pax' }, 50] }
    },
    {
      ID_Regla: 'EARLY_EVENING',
      Nombre: 'Events before 6 PM limited to 100 guests',
      Tipo_Accion: 'WARNING',
      Condicion_JSON: {
        'and': [
          { '<': [{ 'var': 'hora' }, '18:00'] },
          { '>': [{ 'var': 'pax' }, 100] }
        ]
      }
    }
  ]
};
```

## Testing

The component includes comprehensive tests:

```bash
# Run all tests
npm test

# Run only ItemComponent tests
npm test -- ItemComponent.test.js

# Watch mode
npm run test:watch
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Requires ES2020+ (arrow functions, optional chaining, etc.)

## Performance

- **Initial load**: ~2ms (Alpine.js initialization)
- **Calculation**: <1ms per update (all DOM updates handled by Alpine.js reactivity)
- **Bundle size**: 
  - ItemComponent.js: ~12 KB (unminified)
  - Item.js + domain modules: ~18 KB (unminified)
  - Total with Alpine.js: ~50 KB gzipped

## Troubleshooting

### Component not showing?

1. Check Alpine.js is loaded: `console.log(Alpine)`
2. Check ItemComponent is global: `console.log(window.ItemComponent)`
3. Check HTML template is loaded before Alpine.start()

### Values not updating?

1. Use `x-text` for text, not `x-model` (which is for two-way binding)
2. Ensure input @change handlers call the update methods
3. Check browser console for errors

### Styling issues?

1. Make sure CSS variables are defined in `:root`
2. Check for CSS conflicts from other stylesheets
3. Use browser DevTools to inspect computed styles

## Contributing

To extend ItemComponent:

1. Add new methods to the data object returned by `create()`
2. Add tests in `ItemComponent.test.js`
3. Update state object documentation
4. Test with different item definitions and contexts

## License

Same as parent project (see LICENSE)

## See Also

- `Item.js` - Core business logic (pricing, quantities, rules)
- `domain/` - Pure calculation functions
- `ItemComponent.test.js` - Complete test suite
- `ITEMCOMPONENT_DESIGN.md` - Design system documentation
