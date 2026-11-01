// Adapter I/O per l'esportazione e l'importazione dei dati di addestramento.
// Usa expo-file-system / expo-sharing / expo-document-picker con dipendenze iniettabili.

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { buildQuestionIndex, computeCoverageSummary } from './learningEngine';
import {
  buildExportPayload,
  parseExportPayload,
  mergeTrainingData,
} from './trainingTransfer';

export const BACKUP_ERRORS = {
  INVALID_JSON: 'INVALID_JSON',
  INVALID_FORMAT: 'INVALID_FORMAT',
  UNSUPPORTED_VERSION: 'UNSUPPORTED_VERSION',
  INVALID_SHAPE: 'INVALID_SHAPE',
  INVALID_ARCHIVE_DATA: 'INVALID_ARCHIVE_DATA',
  READ_FAILED: 'READ_FAILED',
  WRITE_FAILED: 'WRITE_FAILED',
  SHARING_UNAVAILABLE: 'SHARING_UNAVAILABLE',
  CANCELED: 'CANCELED',
};

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatTimestamp(ms) {
  const date = new Date(ms);
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

/**
 * Legge copertura e arretrato locali senza mai lanciare eccezioni.
 */
export async function loadSnapshot(bank, storage, now = Date.now) {
  const warnings = [];
  let coverage = [];
  let pending = [];

  if (storage && typeof storage.loadCoverage === 'function') {
    try {
      const result = await storage.loadCoverage(bank);
      if (result) {
        if (Array.isArray(result.coverage)) coverage = result.coverage;
        if (result.warning) warnings.push(result.warning);
      }
    } catch (error) {
      warnings.push('Impossibile leggere la copertura locale.');
    }
  }

  if (storage && typeof storage.loadPending === 'function') {
    try {
      const result = await storage.loadPending(bank);
      if (result) {
        if (Array.isArray(result.pending)) pending = result.pending;
        if (result.warning) warnings.push(result.warning);
      }
    } catch (error) {
      warnings.push("Impossibile leggere l'arretrato locale.");
    }
  }

  const index = buildQuestionIndex(bank);

  return {
    coverage,
    pending,
    coverageSummary: computeCoverageSummary(coverage, index.byKey.size),
    warnings,
  };
}

/**
 * Scrive il file di esportazione in cache e apre la condivisione.
 * Restituisce { ok, error?, fileUri? }.
 */
export async function exportData({
  coverage,
  pending,
  bank,
  now = Date.now,
  fileSystem = FileSystem,
  sharing = Sharing,
} = {}) {
  const timestamp = typeof now === 'function' ? now() : now;
  const payload = buildExportPayload({
    coverage,
    pending,
    bank,
    now: timestamp,
  });
  const fileName = `vds-addestramento-${formatTimestamp(timestamp)}.json`;

  let file;
  try {
    file = new fileSystem.File(fileSystem.Paths.cache, fileName);
    if (typeof file.create === 'function') file.create();
    await file.write(JSON.stringify(payload, null, 2));
  } catch (error) {
    return { ok: false, error: BACKUP_ERRORS.WRITE_FAILED };
  }

  try {
    const available =
      typeof sharing.isAvailableAsync === 'function'
        ? await sharing.isAvailableAsync()
        : false;
    if (!available) {
      return { ok: false, error: BACKUP_ERRORS.SHARING_UNAVAILABLE };
    }

    await sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Esporta dati di addestramento',
      UTI: 'public.json',
    });
  } catch (error) {
    return { ok: false, error: BACKUP_ERRORS.SHARING_UNAVAILABLE };
  }

  return { ok: true, fileUri: file.uri };
}

/**
 * Apre il selettore file e legge il contenuto del documento scelto.
 */
export async function pickImportFile({
  documentPicker = DocumentPicker,
  fileSystem = FileSystem,
  fetchImpl,
} = {}) {
  let result;
  try {
    result = await documentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
  } catch (error) {
    return { canceled: false, error: BACKUP_ERRORS.READ_FAILED };
  }

  if (!result || result.canceled || !Array.isArray(result.assets) || !result.assets[0]) {
    return { canceled: true };
  }

  const asset = result.assets[0];
  const uri = asset.uri;

  try {
    const file = new fileSystem.File(uri);
    const text = await file.text();
    if (typeof text !== 'string') {
      throw new Error('contenuto non testuale');
    }
    return { canceled: false, text, name: asset.name || null };
  } catch (error) {
    const fetcher = fetchImpl || (typeof fetch === 'function' ? fetch : null);
    if (fetcher) {
      try {
        const response = await fetcher(uri);
        const text = await response.text();
        return { canceled: false, text, name: asset.name || null };
      } catch (fetchError) {
        return { canceled: false, error: BACKUP_ERRORS.READ_FAILED };
      }
    }
    return { canceled: false, error: BACKUP_ERRORS.READ_FAILED };
  }
}

/**
 * Valida il file, unisce i dati e li persiste: prima la copertura, poi l'arretrato.
 */
export async function importData({ text, bank, storage, now = Date.now } = {}) {
  const parsed = parseExportPayload(text);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const snapshot = await loadSnapshot(bank, storage, now);
  const merged = mergeTrainingData(
    { coverage: snapshot.coverage, pending: snapshot.pending },
    parsed.data,
    bank,
    now
  );
  if (!merged.ok) {
    return { ok: false, error: merged.error };
  }

  if (storage && typeof storage.saveCoverage === 'function') {
    const result = await storage.saveCoverage(merged.coverage);
    if (result && result.warning) {
      return { ok: false, error: BACKUP_ERRORS.WRITE_FAILED, warning: result.warning };
    }
  }

  if (storage && typeof storage.savePending === 'function') {
    const result = await storage.savePending(merged.pending);
    if (result && result.warning) {
      return { ok: false, error: BACKUP_ERRORS.WRITE_FAILED, warning: result.warning };
    }
  }

  return {
    ok: true,
    error: null,
    coverageAdded: merged.coverageAdded,
    coverageTotal: merged.coverageTotal,
    pendingAdded: merged.pendingAdded,
    pendingUpdated: merged.pendingUpdated,
    coverageSummary: merged.coverageSummary,
    warning: null,
  };
}

export default {
  BACKUP_ERRORS,
  loadSnapshot,
  exportData,
  pickImportFile,
  importData,
};
