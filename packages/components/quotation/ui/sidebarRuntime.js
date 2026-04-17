export const sidebarRuntimeHtml = `
<aside class="sidebar panel" x-data="sidebar">
  <section class="global-context-panel" x-data="{ open: true }">
    <button class="global-context-head" @click="open = !open">
      <span class="global-context-title" x-text="selectedClient?.nombre || 'No client selected'"></span>
      <i class="fa-solid fa-chevron-down" :class="open ? 'open' : ''"></i>
    </button>

    <div class="global-context-body" x-show="open" x-cloak>
      <div class="client-row">
        <h3>Client</h3>
        <button class="btn btn-small btn-secondary" @click="openClientModal()">Change</button>
      </div>
      <template x-if="selectedClient">
        <div>
          <p class="client-name" x-text="selectedClient.nombre"></p>
          <p class="muted" x-text="selectedClient.rut || '-' "></p>
          <p class="muted" x-text="selectedClient.email || '-' "></p>
        </div>
      </template>
      <template x-if="!selectedClient">
        <p class="muted">No client selected.</p>
      </template>

      <h3>Quotation Settings</h3>
      <div class="config-grid">
        <label>
          <span>Start Date</span>
          <input type="date" :value="settings.fechaInicio" @change="setSetting('fechaInicio', $event.target.value)" />
        </label>
        <label>
          <span>Days</span>
          <input type="number" min="1" :value="settings.duracionDias" @change="setSetting('duracionDias', $event.target.value)" />
        </label>
        <label>
          <span>Pax Global</span>
          <input type="number" min="1" :value="settings.paxGlobal" @change="setSetting('paxGlobal', $event.target.value)" />
        </label>
      </div>
    </div>
  </section>

  <section class="catalog-panel">
    <div class="catalog-header">
      <h3>Catalog</h3>
      <input
        type="text"
        placeholder="Search category or item"
        :value="catalog.searchTerm"
        @input="setCatalogSearch($event.target.value)"
      />
    </div>
    <p class="catalog-hint" x-show="draggingCatalogItemId">Drop an item on day tabs or timeline</p>
    <div class="categories-list">
      <template x-for="category in catalog.categories" :key="category.id">
        <article class="category-card">
          <button class="category-head" @click="toggleCategory(category.id)">
            <span class="category-name" x-text="category.nombre"></span>
            <i class="fa-solid fa-chevron-down" :class="category.isExpanded ? 'open' : ''"></i>
          </button>
          <div class="category-body" x-show="category.isExpanded" x-cloak>
            <template x-if="!category.isLoaded">
              <p class="muted">Loading...</p>
            </template>
            <div x-show="category.isLoaded" x-data="{ get catalogEntries() { return category.catalogEntries || []; } }">
              <!-- CATALOG_RUNTIME -->
            </div>
          </div>
        </article>
      </template>
    </div>
  </section>
</aside>
`;
