import { ModelFactory } from '../ModelFactory.js';
import { GasSheetStore } from '../stores/GasSheetStore.js';
import { SHEET_SCHEMA } from './sheetSchema.js';

const runtimeCache = new Map();

function buildGasModels(spreadsheetId) {
  if (!spreadsheetId) {
    throw new Error('Missing spreadsheetId for GAS runtime');
  }

  return ModelFactory.createModels({
    schema: SHEET_SCHEMA,
    storeFactory: ({ tableName, columns }) => {
      return new GasSheetStore({
        spreadsheetId,
        tableName,
        columns
      });
    }
  });
}

export function getGasModels(spreadsheetId) {
  if (!runtimeCache.has(spreadsheetId)) {
    runtimeCache.set(spreadsheetId, buildGasModels(spreadsheetId));
  }

  return runtimeCache.get(spreadsheetId);
}

export function clearGasModelsCache() {
  runtimeCache.clear();
}
