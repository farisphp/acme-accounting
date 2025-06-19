export const TMP_DIR = 'tmp';
export const REPORTS_DIR = 'out/';
export const ACCOUNT_REPORT_FILE_NAME = 'accounts.csv';
export const YEARLY_REPORT_FILE_NAME = 'yearly.csv';
export const FS_REPORT_FILE_NAME = 'fs.csv';
export const ACCOUNT_REPORT_PATH = `${REPORTS_DIR}${ACCOUNT_REPORT_FILE_NAME}`;
export const YEARLY_REPORT_PATH = `${REPORTS_DIR}${YEARLY_REPORT_FILE_NAME}`;
export const FS_REPORT_PATH = `${REPORTS_DIR}${FS_REPORT_FILE_NAME}`;
export const FS_CATEGORIES = {
  'Income Statement': {
    Revenues: ['Sales Revenue'],
    Expenses: [
      'Cost of Goods Sold',
      'Salaries Expense',
      'Rent Expense',
      'Utilities Expense',
      'Interest Expense',
      'Tax Expense',
    ],
  },
  'Balance Sheet': {
    Assets: [
      'Cash',
      'Accounts Receivable',
      'Inventory',
      'Fixed Assets',
      'Prepaid Expenses',
    ],
    Liabilities: [
      'Accounts Payable',
      'Loan Payable',
      'Sales Tax Payable',
      'Accrued Liabilities',
      'Unearned Revenue',
      'Dividends Payable',
    ],
    Equity: ['Common Stock', 'Retained Earnings'],
  },
};
