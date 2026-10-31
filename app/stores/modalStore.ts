import { create } from 'zustand';

export interface HoldingModalState {
  open: boolean;
  fund?: any;
  fundCode?: string | null;
  groupId?: string;
  [key: string]: any;
}

export interface ActionModalState {
  open: boolean;
  fund?: any;
  fundCode?: string | null;
  groupId?: string;
  [key: string]: any;
}

export interface TradeModalState {
  open: boolean;
  fund?: any;
  fundCode?: string | null;
  type?: 'buy' | 'sell';
  groupId?: string;
  [key: string]: any;
}

export interface ConvertModalState {
  open: boolean;
  fund?: any;
  fundCode?: string | null;
  groupId?: string;
  [key: string]: any;
}

export interface DividendMethodModalState {
  open: boolean;
  fund?: any;
  fundCode?: string | null;
  groupId?: string;
  [key: string]: any;
}

export interface SelectFundSingleModalState {
  open: boolean;
  excludeCodes?: string[];
  initialSelectedCode?: string;
  _nonce?: number | null;
  _resolve?: any;
  [key: string]: any;
}

export interface SelectHoldingGroupModalState {
  open: boolean;
  fund?: any;
  fundCode?: string | null;
  [key: string]: any;
}

export interface DataSourceModalState {
  open: boolean;
  fund?: any;
  fundCode?: string | null;
  [key: string]: any;
}

export interface DcaModalState {
  open: boolean;
  fund?: any;
  fundCode?: string | null;
  groupId?: string;
  [key: string]: any;
}

export interface HistoryModalState {
  open: boolean;
  fund?: any;
  fundCode?: string | null;
  groupId?: string;
  [key: string]: any;
}

export interface AddHistoryModalState {
  open: boolean;
  fund?: any;
  fundCode?: string | null;
  groupId?: string;
  [key: string]: any;
}

export interface FundTagsEditState {
  open: boolean;
  code?: string | null;
  name?: string;
  tags?: any[];
  _tick?: number;
  [key: string]: any;
}

export interface HoldingMigrateDialogState {
  open: boolean;
  code?: string | null;
  name?: string;
  targetGroupId?: string | null;
  [key: string]: any;
}

export interface DeviceConflictModalState {
  open: boolean;
  message?: string;
  userId?: string | null;
  payload?: any;
  isPartial?: boolean;
  [key: string]: any;
}

export interface SuccessModalState {
  open: boolean;
  message?: string;
  [key: string]: any;
}

export interface ScanProgressState {
  stage?: string;
  current?: number;
  total?: number;
  [key: string]: any;
}

export interface ScanImportProgressState {
  current?: number;
  total?: number;
  success?: number;
  failed?: number;
  [key: string]: any;
}

// ---- Module-level resolve map for Promise-based selectFundSingleModal ----
const selectFundSingleResolvers = new Map<number, (picked: any) => void>();
let selectFundSingleNonce = 0;

// ---- Default shapes for object-style modals ----
const DEFAULTS = {
  holdingModal: { open: false, fundCode: null, groupId: undefined } as HoldingModalState,
  actionModal: { open: false, fundCode: null, groupId: undefined } as ActionModalState,
  tradeModal: { open: false, fundCode: null, type: 'buy', groupId: undefined } as TradeModalState,
  convertModal: { open: false, fundCode: null, groupId: undefined } as ConvertModalState,
  dividendMethodModal: { open: false, fundCode: null, groupId: undefined } as DividendMethodModalState,
  selectFundSingleModal: {
    open: false,
    excludeCodes: [],
    initialSelectedCode: '',
    _nonce: null
  } as SelectFundSingleModalState,
  selectHoldingGroupModal: { open: false, fundCode: null } as SelectHoldingGroupModalState,
  dataSourceModal: { open: false, fundCode: null } as DataSourceModalState,
  dcaModal: { open: false, fundCode: null, groupId: undefined } as DcaModalState,
  historyModal: { open: false, fundCode: null, groupId: undefined } as HistoryModalState,
  addHistoryModal: { open: false, fundCode: null, groupId: undefined } as AddHistoryModalState,
  fundTagsEdit: { open: false, code: null, name: '', tags: [] } as FundTagsEditState,
  holdingMigrateDialog: { open: false, code: null, name: '', targetGroupId: null } as HoldingMigrateDialogState,
  deviceConflictModal: {
    open: false,
    message: '',
    userId: null,
    payload: null,
    isPartial: false
  } as DeviceConflictModalState,
  successModal: { open: false, message: '' } as SuccessModalState
};

const getClosedModalState = () => ({
  settingsOpen: false,
  feedbackOpen: false,
  weChatOpen: false,
  donateOpen: false,
  tutorialDrawerOpen: false,
  updateLogOpen: false,
  isUpdateModalOpen: false,
  isLogoutConfirmOpen: false,
  mobileTableSettingModalOpen: false,
  mobileFundDrawerOpen: false,
  portfolioEarningsOpen: false,
  sortSettingOpen: false,
  allSectorsModalOpen: false,
  groupModalOpen: false,
  groupManageOpen: false,
  addFundToGroupOpen: false,
  holdingModal: { ...DEFAULTS.holdingModal },
  actionModal: { ...DEFAULTS.actionModal },
  tradeModal: { ...DEFAULTS.tradeModal },
  convertModal: { ...DEFAULTS.convertModal },
  dividendMethodModal: { ...DEFAULTS.dividendMethodModal },
  selectFundSingleModal: { ...DEFAULTS.selectFundSingleModal },
  selectHoldingGroupModal: { ...DEFAULTS.selectHoldingGroupModal },
  dataSourceModal: { ...DEFAULTS.dataSourceModal },
  dcaModal: { ...DEFAULTS.dcaModal },
  historyModal: { ...DEFAULTS.historyModal },
  addHistoryModal: { ...DEFAULTS.addHistoryModal },
  fundTagsEdit: { ...DEFAULTS.fundTagsEdit },
  clearConfirm: null as any,
  fundDeleteConfirm: null as any,
  fundDeleteBulkConfirm: null as any,
  holdingMigrateDialog: { ...DEFAULTS.holdingMigrateDialog },
  deviceConflictModal: { ...DEFAULTS.deviceConflictModal },
  successModal: { ...DEFAULTS.successModal },
  scanModalOpen: false,
  scanConfirmModalOpen: false,
  aiConfigModalOpen: false,
  isScanning: false,
  isScanImporting: false,
  scannedFunds: [] as any[],
  selectedScannedCodes: new Set<string>(),
  scanProgress: { stage: 'ocr', current: 0, total: 0 } as ScanProgressState,
  scanImportProgress: { current: 0, total: 0, success: 0, failed: 0 } as ScanImportProgressState,
  isOcrScan: false
});

export interface ModalStoreState {
  settingsOpen: boolean;
  feedbackOpen: boolean;
  feedbackNonce: number;
  weChatOpen: boolean;
  donateOpen: boolean;
  tutorialDrawerOpen: boolean;
  updateLogOpen: boolean;
  isUpdateModalOpen: boolean;
  isLogoutConfirmOpen: boolean;
  mobileTableSettingModalOpen: boolean;
  mobileFundDrawerOpen: boolean;
  portfolioEarningsOpen: boolean;
  sortSettingOpen: boolean;
  allSectorsModalOpen: boolean;
  allSectorsFilter: string;
  allSectorsSort: string;
  allSectorsSortOrder: 'desc' | 'asc';

  groupModalOpen: boolean;
  groupManageOpen: boolean;
  addFundToGroupOpen: boolean;

  holdingModal: HoldingModalState;
  actionModal: ActionModalState;
  tradeModal: TradeModalState;
  convertModal: ConvertModalState;
  dividendMethodModal: DividendMethodModalState;
  selectFundSingleModal: SelectFundSingleModalState;
  selectHoldingGroupModal: SelectHoldingGroupModalState;
  dataSourceModal: DataSourceModalState;
  dcaModal: DcaModalState;
  historyModal: HistoryModalState;
  addHistoryModal: AddHistoryModalState;
  fundTagsEdit: FundTagsEditState;

  clearConfirm: any;
  fundDeleteConfirm: any;
  fundDeleteBulkConfirm: any;
  holdingMigrateDialog: HoldingMigrateDialogState;

  deviceConflictModal: DeviceConflictModalState;
  successModal: SuccessModalState;

  scanModalOpen: boolean;
  scanConfirmModalOpen: boolean;
  aiConfigModalOpen: boolean;
  isScanning: boolean;
  isScanImporting: boolean;
  scannedFunds: any[];
  selectedScannedCodes: Set<string>;
  scanProgress: ScanProgressState;
  scanImportProgress: ScanImportProgressState;
  isOcrScan: boolean;
  modalErrorResetKey: number;

  closeModal: (name: string) => void;
  setAiConfigModalOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  closeAllModals: () => void;
  handleAction: (type: string, fundCode: string | null, groupId?: string) => void;
  openSelectFundSingle: (excludeCodes?: string[], initialSelectedCode?: string) => Promise<any>;
  resolveSelectFundSingle: (picked: any) => void;
}

export const useModalStore = create<ModalStoreState>((set, get) => ({
  // ---- Simple boolean modals ----
  settingsOpen: false,
  feedbackOpen: false,
  feedbackNonce: 0,
  weChatOpen: false,
  donateOpen: false,
  tutorialDrawerOpen: false,
  updateLogOpen: false,
  isUpdateModalOpen: false,
  isLogoutConfirmOpen: false,
  mobileTableSettingModalOpen: false,
  mobileFundDrawerOpen: false,
  portfolioEarningsOpen: false,
  sortSettingOpen: false,
  allSectorsModalOpen: false,
  allSectorsFilter: 'industry',
  allSectorsSort: 'change_pct',
  allSectorsSortOrder: 'desc',

  // ---- Group modals ----
  groupModalOpen: false,
  groupManageOpen: false,
  addFundToGroupOpen: false,

  // ---- Data-bearing modals ----
  holdingModal: { ...DEFAULTS.holdingModal },
  actionModal: { ...DEFAULTS.actionModal },
  tradeModal: { ...DEFAULTS.tradeModal },
  convertModal: { ...DEFAULTS.convertModal },
  dividendMethodModal: { ...DEFAULTS.dividendMethodModal },
  selectFundSingleModal: { ...DEFAULTS.selectFundSingleModal },
  selectHoldingGroupModal: { ...DEFAULTS.selectHoldingGroupModal },
  dataSourceModal: { ...DEFAULTS.dataSourceModal },
  dcaModal: { ...DEFAULTS.dcaModal },
  historyModal: { ...DEFAULTS.historyModal },
  addHistoryModal: { ...DEFAULTS.addHistoryModal },
  fundTagsEdit: { ...DEFAULTS.fundTagsEdit },

  // ---- Confirm dialogs (truthy/null) ----
  clearConfirm: null,
  fundDeleteConfirm: null,
  fundDeleteBulkConfirm: null,
  holdingMigrateDialog: { ...DEFAULTS.holdingMigrateDialog },

  // ---- Cloud/sync modals ----
  deviceConflictModal: { ...DEFAULTS.deviceConflictModal },
  successModal: { ...DEFAULTS.successModal },

  // ---- Scan modals (migrated from useScanImport) ----
  scanModalOpen: false,
  scanConfirmModalOpen: false,
  aiConfigModalOpen: false,
  isScanning: false,
  isScanImporting: false,
  scannedFunds: [],
  selectedScannedCodes: new Set(),
  scanProgress: { stage: 'ocr', current: 0, total: 0 },
  scanImportProgress: { current: 0, total: 0, success: 0, failed: 0 },
  isOcrScan: false,
  modalErrorResetKey: 0,

  // ---- Actions ----

  /** Generic close: resets a named modal to its default value */
  closeModal: (name: string) => {
    if ((DEFAULTS as Record<string, any>)[name]) {
      set({ [name]: { ...(DEFAULTS as Record<string, any>)[name] } } as Partial<ModalStoreState>);
    } else {
      // boolean modals and confirm dialogs
      set({ [name]: false } as Partial<ModalStoreState>);
    }
  },

  setAiConfigModalOpen: (v) =>
    set((state) => ({
      aiConfigModalOpen: typeof v === 'function' ? v(state.aiConfigModalOpen) : v
    })),

  /** Close all modal/drawer/dialog state after a render-time crash. */
  closeAllModals: () =>
    set((state) => ({
      ...getClosedModalState(),
      modalErrorResetKey: state.modalErrorResetKey + 1
    })),

  /**
   * Central modal router: closes actionModal, opens target modal.
   * All in one set() for atomicity.
   */
  handleAction: (type: string, fundCode: string | null, groupId?: string) => {
    const base = type !== 'history' ? { actionModal: { ...DEFAULTS.actionModal } } : {};

    if (type === 'edit') {
      set({ ...base, holdingModal: { open: true, fundCode, groupId } });
    } else if (type === 'clear') {
      set({ ...base, clearConfirm: { fundCode, groupId } });
    } else if (type === 'buy' || type === 'sell') {
      set({ ...base, tradeModal: { open: true, fundCode, type, groupId } });
    } else if (type === 'history') {
      set({ ...base, historyModal: { open: true, fundCode, groupId } });
    } else if (type === 'dca') {
      set({ ...base, dcaModal: { open: true, fundCode, groupId } });
    } else if (type === 'convert') {
      set({ ...base, convertModal: { open: true, fundCode, groupId } });
    } else if (type === 'dividend') {
      set({ ...base, dividendMethodModal: { open: true, fundCode, groupId } });
    }
  },

  /**
   * Opens selectFundSingleModal and returns a Promise that resolves
   * with the picked fund (or null on cancel).
   */
  openSelectFundSingle: (excludeCodes?: string[], initialSelectedCode?: string) => {
    const nonce = ++selectFundSingleNonce;
    return new Promise((resolve) => {
      selectFundSingleResolvers.set(nonce, resolve);
      set({
        selectFundSingleModal: {
          open: true,
          excludeCodes: excludeCodes || [],
          initialSelectedCode: initialSelectedCode || '',
          _nonce: nonce
        }
      });
    });
  },

  /** Resolves the pending selectFundSingleModal Promise and closes the modal */
  resolveSelectFundSingle: (picked: any) => {
    const { selectFundSingleModal } = get();
    const nonce = selectFundSingleModal._nonce;
    if (nonce != null) {
      const resolve = selectFundSingleResolvers.get(nonce);
      if (resolve) {
        resolve(picked);
        selectFundSingleResolvers.delete(nonce);
      }
    }
    set({ selectFundSingleModal: { ...DEFAULTS.selectFundSingleModal } });
  }
}));

// ---- Non-React accessor for use in callbacks ----
export const getModalState = (): ModalStoreState => useModalStore.getState();
