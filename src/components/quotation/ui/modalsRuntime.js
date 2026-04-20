export const modalsRuntimeHtml = `
<div x-data="modals">
  <div class="modal-overlay" x-show="clientModalOpen" x-cloak>
    <div class="modal panel" @click.away="closeClientModal()">
      <div class="modal-head">
        <h3>Select Client</h3>
        <button class="btn btn-small btn-secondary" @click="closeClientModal()">Close</button>
      </div>
      <input
        type="text"
        placeholder="Search by name/rut/email"
        :value="clientSearchTerm"
        @input="setClientSearch($event.target.value)"
      />
      <div class="client-list">
        <template x-for="client in filteredClients()" :key="client.id">
          <button class="client-item" @click="selectClient(client.id)">
            <strong x-text="client.nombre"></strong>
            <small x-text="(client.rut || '-') + ' · ' + (client.email || '-')"></small>
          </button>
        </template>
      </div>
    </div>
  </div>

  <div class="modal-overlay" x-show="quotationSearchModalOpen" x-cloak>
    <div class="modal panel" @click.away="closeQuotationSearchModal()">
      <div class="modal-head">
        <h3>Buscar cotizacion</h3>
        <button class="btn btn-small btn-secondary" @click="closeQuotationSearchModal()">Close</button>
      </div>
      <input
        type="text"
        placeholder="Buscar por cliente, fecha o ID"
        :value="quotationSearchTerm"
        @input="setQuotationSearch($event.target.value)"
      />
      <p class="muted" x-show="quotationSearchLoading">Cargando cotizaciones...</p>
      <p class="error-text" x-show="quotationSearchError" x-text="quotationSearchError"></p>
      <div class="client-list quotation-list" x-show="!quotationSearchLoading">
        <template x-for="quotation in filteredQuotations()" :key="quotation.quotationId">
          <button class="client-item quotation-item" @click="selectQuotationResult(quotation.quotationId)">
            <strong x-text="quotation.clientName"></strong>
            <small>
              <span x-text="'Pax ' + (quotation.pax || 0)"></span>
              <span x-text="' · ' + (quotation.quotationDate || '-')"></span>
              <span x-text="' · ' + (quotation.quotationId || '-')"></span>
            </small>
          </button>
        </template>
        <p class="muted" x-show="filteredQuotations().length === 0 && !quotationSearchError">
          No hay cotizaciones para mostrar.
        </p>
      </div>
    </div>
  </div>
</div>
`;
