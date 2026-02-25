import {
  createAppState,
  createHomePage,
  createClientSelector,
  createQuotationInitializer
} from '../modals/index.js';
import {
  createQuotationView,
  createSidebar,
  createBasket,
  createQuotationHeader,
  createQuotationTotals
} from '../views/index.js';

const DEMO_CLIENTS = [
  { id: 'C-001', nombre: 'Empresa Andina', rut: '76.123.456-7', email: 'eventos@andina.cl' },
  { id: 'C-002', nombre: 'Corporacion Pacifico', rut: '77.987.654-3', email: 'compras@pacifico.cl' },
  { id: 'C-003', nombre: 'Inversiones Austral', rut: '96.555.111-2', email: 'hola@austral.cl' }
];

const DEMO_CATALOG = [
  { id: 'I-001', name: 'Coffee Break Intermedio', category: 'Coffee', price: 460 },
  { id: 'I-002', name: 'Open Bar Clasico', category: 'Bar', price: 850 },
  { id: 'I-003', name: 'Brunch Campestre', category: 'Brunch', price: 1200 },
  { id: 'I-004', name: 'Estacion de Postres', category: 'Postres', price: 640 }
];

/**
 * Mount a live quotation flow demo using the new package components.
 * @param {HTMLElement|null} root
 */
export async function mountQuotationFlow(root) {
  if (!root) return;

  const templatePath = '/packages/components/quotation/ui/QuotationFlowDemo.html';
  const html = await fetch(templatePath).then((res) => res.text());

  const appState = createAppState().openModal('HOME');
  const home = createHomePage();
  const clientSelector = createClientSelector(DEMO_CLIENTS);
  const initializer = createQuotationInitializer({ duracion: 1 });
  const quotationView = createQuotationView();
  const sidebar = createSidebar(DEMO_CATALOG);
  const basket = createBasket().setSelectedDayIndex(0).setItemsForDay(0, []);
  const header = createQuotationHeader();
  const totals = createQuotationTotals(0);

  quotationView.setSidebar(sidebar).setBasket(basket).setHeader(header).setTotals(totals);

  home.on('NEW_QUOTATION', () => {
    appState.openModal('CLIENT_SELECTOR');
    clientSelector.open();
  });
  home.on('LOAD_PREVIOUS', () => {
    appState.openModal('PREVIOUS_QUOTES');
  });
  home.on('VIEW_DATABASE', () => {
    appState.openModal('DATABASE_VIEWER');
  });

  clientSelector.on('CLIENT_SELECTED', (client) => {
    appState.setSelectedClient(client).openModal('QUOTATION_INITIALIZER');
    clientSelector.close();
    initializer.open();
    header.setContext({ clientName: client.nombre });
  });
  clientSelector.on('CANCEL', () => {
    appState.openModal('HOME');
  });

  initializer.on('FORM_SUBMITTED', (context) => {
    appState.setQuotationContext(context).openModal('QUOTATION');
    initializer.close();
    header.setContext({
      pax: context.pax,
      fecha: context.fecha,
      duracion: context.duracion
    });
  });
  initializer.on('FORM_CANCELLED', () => {
    appState.openModal('CLIENT_SELECTOR');
  });

  sidebar.on('ITEM_SELECTED', (item) => {
    basket.addItem(createBasketLine(item), 0);
    refreshTotals(basket, totals);
  });

  window.quotationFlowComponent = function quotationFlowComponent() {
    return {
      app: {},
      home: {},
      clients: {},
      initForm: {},
      quote: {},
      sidebar: {},
      basket: {},
      header: {},
      totals: {},

      init() {
        this.sync();
      },

      sync() {
        this.app = appState.toDisplayObject();
        this.home = home.toDisplayObject();
        this.clients = clientSelector.toDisplayObject();
        this.initForm = initializer.toDisplayObject();
        this.quote = quotationView.toDisplayObject();
        this.sidebar = sidebar.toDisplayObject();
        this.basket = basket.toDisplayObject();
        this.header = header.toDisplayObject();
        this.totals = totals.toDisplayObject();
      },

      clickHome(actionId) {
        home.clickAction(actionId);
        this.sync();
      },

      backHome() {
        appState.openModal('HOME');
        this.sync();
      },

      searchClients(term) {
        clientSelector.search(term);
        this.sync();
      },

      selectClient(clientId) {
        clientSelector.selectClient(clientId);
        this.sync();
      },

      setInitField(fieldName, value) {
        initializer.setField(fieldName, value);
        this.sync();
      },

      async submitInitializer() {
        await initializer.submit();
        this.sync();
      },

      addItem(itemId) {
        sidebar.selectItem(itemId);
        this.sync();
      },

      removeItem(itemId) {
        basket.removeItem(itemId, 0);
        refreshTotals(basket, totals);
        this.sync();
      },

      resetFlow() {
        appState.resetFlow();
        basket.setItemsForDay(0, []);
        totals.setSubtotal(0);
        this.sync();
      }
    };
  };

  root.innerHTML = html;
  if (window.Alpine && typeof window.Alpine.initTree === 'function') {
    window.Alpine.initTree(root);
  }
}

function createBasketLine(item) {
  return {
    id: `${item.id}-${Date.now()}`,
    name: item.name,
    category: item.category,
    total: Number(item.price) || 0
  };
}

function refreshTotals(basket, totals) {
  const subtotal = basket.getItemsForDay(0).reduce((sum, item) => sum + Number(item.total || 0), 0);
  totals.setSubtotal(subtotal);
}
