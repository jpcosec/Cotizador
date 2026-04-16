export const catalogRuntimeHtml = `
          <template x-if="catalogEntries.length === 0">
            <p class="empty">No catalog entities yet</p>
          </template>
          <template x-for="entry in catalogEntries" :key="entry.id">
            <div class="entity-wrap">
              <article class="mini-card runtime-card catalog-card"
                       :class="(typeof isDraggingCatalogItem === 'function' && isDraggingCatalogItem(entry.state.definition?.id || entry.itemId || entry.state.definition?.ID_Item)) ? 'is-dragging' : ''"
                       :draggable="typeof startCatalogDrag === 'function'"
                       @dragstart="typeof startCatalogDrag === 'function' && startCatalogDrag(entry.state.definition?.id || entry.itemId || entry.state.definition?.ID_Item, $event)"
                       @dragend="typeof endCatalogDrag === 'function' && endCatalogDrag()"
                       x-data="{ showGlosa: false, rulesHover: false }"
                       @mouseenter="showGlosa = true"
                       @mouseleave="showGlosa = false; rulesHover = false">
                <div class="mini-main">
                  <span class="category-badge" x-text="entry.state.definition?.category || 'Sin categoria'"></span>
                  <h5 x-text="entry.state.definition?.name || 'Item'"></h5>
                  <p class="catalog-formula" x-text="entry.state.catalogFormulaHuman || '-' "></p>
                  <div class="glosa-popover"
                       x-show="showGlosa && !rulesHover && (entry.state.definition?.description || '').trim().length > 0"
                       style="display:none;"
                       x-text="entry.state.definition?.description">
                  </div>
                </div>
                <div class="card-actions">
                  <div class="rules-indicator" x-data="{ open: false }" @mouseenter="open = true; rulesHover = true" @mouseleave="open = false; rulesHover = false">
                    <div class="rules-dot" :class="'dot-' + ruleClass(entry.state)">
                      <i class="fa-solid fa-xs" :class="ruleIcon(entry.state)"></i>
                    </div>
                    <div class="rules-popover" x-show="open" style="display:none;">
                      <div class="popover-header">Rules (<span x-text="(entry.state.definition?.rules || []).length"></span>)</div>
                      <template x-if="(entry.state.definition?.rules || []).length === 0">
                        <div class="popover-empty">No rules</div>
                      </template>
                      <template x-for="rule in (entry.state.definition?.rules || [])" :key="rule.ID_Regla">
                        <div class="popover-rule-row"
                             :class="(entry.state.appliedRules || []).some(r => r.id === rule.ID_Regla) ? (rule.Tipo_Accion === 'ERROR' ? 'row-error' : 'row-warn') : ''">
                          <i class="fa-solid fa-xs"
                             :class="(entry.state.appliedRules || []).some(r => r.id === rule.ID_Regla) ? (rule.Tipo_Accion === 'ERROR' ? 'fa-circle-xmark' : 'fa-triangle-exclamation') : 'fa-circle'"></i>
                          <span x-text="rule.Nombre"></span>
                        </div>
                      </template>
                    </div>
                  </div>
                  <button class="icon-action"
                          x-show="typeof shipCatalogEntry === 'function'"
                          @click.stop="shipCatalogEntry(entry.state.definition?.id || entry.itemId || entry.state.definition?.ID_Item)"
                          title="Ship to basket"
                          aria-label="Ship to basket">
                    <i class="fa-solid fa-plus"></i>
                  </button>
                </div>
              </article>
            </div>
          </template>
`;

export const basketRuntimeHtml = `
          <template x-if="basketEntries.length === 0">
            <p class="empty">No basket entities yet</p>
          </template>
          <template x-for="entry in basketEntries" :key="entry.id">
            <article class="accordion-item runtime-card basket-card" x-data="{ expanded: true }">
              <div class="accordion-header" @click="expanded = !expanded">
                <div class="acc-time" x-show="entry.state.showHora">
                  <input
                    type="time"
                    :value="entry.state.overrides?.hora || entry.state.schedule?.hora || globalContext.hora || '09:00'"
                    @click.stop
                    @change="setItemTime(entry.id, $event.target.value)"
                    class="time-input-small"
                  >
                </div>
                <div class="acc-info">
                  <div class="acc-title" x-text="entry.state.definition?.name || 'Item'"></div>
                  <div class="acc-subtitle" x-text="entry.state.basketLegend || '-' "></div>
                </div>
                <div class="rules-indicator" x-data="{ open: false }" @mouseenter="open = true" @mouseleave="open = false" @click.stop>
                  <div class="rules-dot" :class="'dot-' + ruleClass(entry.state)">
                    <i class="fa-solid fa-xs" :class="ruleIcon(entry.state)"></i>
                  </div>
                  <div class="rules-popover rules-popover-right" x-show="open" style="display:none;">
                    <div class="popover-header">Rules (<span x-text="(entry.state.definition?.rules || []).length"></span>)</div>
                    <template x-if="(entry.state.definition?.rules || []).length === 0">
                      <div class="popover-empty">No rules</div>
                    </template>
                    <template x-for="rule in (entry.state.definition?.rules || [])" :key="rule.ID_Regla">
                      <div class="popover-rule-row"
                           :class="(entry.state.appliedRules || []).some(r => r.id === rule.ID_Regla) ? (rule.Tipo_Accion === 'ERROR' ? 'row-error' : 'row-warn') : ''">
                        <i class="fa-solid fa-xs"
                           :class="(entry.state.appliedRules || []).some(r => r.id === rule.ID_Regla) ? (rule.Tipo_Accion === 'ERROR' ? 'fa-circle-xmark' : 'fa-triangle-exclamation') : 'fa-circle'"></i>
                        <span x-text="rule.Nombre"></span>
                      </div>
                    </template>
                  </div>
                </div>
                <div class="acc-total-pill">
                  $<span x-text="formatMoney(entry.state.total)"></span>
                </div>
                <div class="acc-toggle">
                  <i class="fa-solid" :class="expanded ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                </div>
              </div>

              <div class="accordion-body" x-show="expanded">
                <div class="accordion-layout">
                  <div class="accordion-col-left">
                    <div class="control-group" x-show="entry.state.showPaxControl" :class="entry.state.isUserSetPax ? 'field-user-set' : ''">
                      <label>Pax <span class="manual-badge" x-show="entry.state.isUserSetPax">manual</span></label>
                      <input type="number" :value="entry.state.quantities?.pax || 0" @change="setBasketOverride(entry.id, 'pax', $event.target.value)" min="0">
                    </div>
                    <div class="control-group" x-show="entry.state.showUnitsControl" :class="entry.state.isUserSetCantidad ? 'field-user-set' : ''">
                      <label>Unidades <span class="manual-badge" x-show="entry.state.isUserSetCantidad">manual</span></label>
                      <input type="number" :value="entry.state.quantities?.cantidad || 0" @change="setBasketOverride(entry.id, 'cantidad', $event.target.value)" min="0">
                    </div>
                    <div class="control-group" x-show="entry.state.showTimeControl" :class="entry.state.isUserSetDuracion ? 'field-user-set' : ''">
                      <label>Duracion (min) <span class="manual-badge" x-show="entry.state.isUserSetDuracion">manual</span></label>
                      <input type="number" :value="entry.state.quantities?.duracionMin || 0" @change="setItemDuration(entry.id, $event.target.value)" min="0" step="15">
                    </div>

                    <div class="line-price-box">
                      <div class="line-price-row" x-show="Number(entry.state.lineRateValue || 0) > 0">
                        <span x-text="entry.state.lineRateLabel || 'Fijo'"></span>
                        <strong x-text="'$' + formatMoney(entry.state.lineRateValue)"></strong>
                      </div>
                      <div class="line-price-row" x-show="(entry.state.lineBaseValue || 0) > 0">
                        <span>Base fija</span>
                        <strong x-text="'$' + formatMoney(entry.state.lineBaseValue)"></strong>
                      </div>
                      <div class="line-price-row total-row">
                        <span>Total</span>
                        <strong x-text="'$' + formatMoney(entry.state.total)"></strong>
                      </div>
                    </div>
                  </div>

                  <div class="accordion-col-middle">
                    <div class="field">
                      <label>Comentario</label>
                      <textarea
                        rows="5"
                        :value="('comentarios' in (entry.state.overrides || {})) ? entry.state.overrides.comentarios : (entry.state.definition?.description || '')"
                        @change="setItemComment(entry.id, $event.target.value)"
                        placeholder="Comentario de la linea..."
                      ></textarea>
                    </div>
                  </div>

                  <div class="accordion-col-actions">
                    <button class="icon-action" title="Reset overrides" aria-label="Reset overrides" @click="resetBasketOverrides(entry.id)"><i class="fa-solid fa-rotate-left"></i></button>
                    <button class="icon-action" title="Copy" @click="typeof copyBasketEntry === 'function' && copyBasketEntry(entry.id)"><i class="fa-solid fa-forward-step"></i></button>
                    <button class="icon-action" title="Duplicate" @click="typeof duplicateBasketEntry === 'function' && duplicateBasketEntry(entry.id)"><i class="fa-solid fa-copy"></i></button>
                    <button class="icon-action danger" title="Remove" aria-label="Remove" @click="destroyRuntimeEntry('basket', entry.id)"><i class="fa-solid fa-trash"></i></button>
                  </div>
                </div>
              </div>
            </article>
          </template>
`;
