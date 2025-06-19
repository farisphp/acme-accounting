import { Injectable } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import {
  ACCOUNT_REPORT_FILE_NAME,
  YEARLY_REPORT_FILE_NAME,
  FS_REPORT_FILE_NAME,
  TMP_DIR,
  ACCOUNT_REPORT_PATH,
  YEARLY_REPORT_PATH,
  FS_REPORT_PATH,
  FS_CATEGORIES,
} from './constants';

@Injectable()
export class ReportsService {
  private states = {
    accounts: 'idle',
    yearly: 'idle',
    fs: 'idle',
  };

  state(scope: keyof typeof this.states) {
    return this.states[scope];
  }

  async generateAll() {
    this.states.accounts = 'starting';
    this.states.yearly = 'starting';
    this.states.fs = 'starting';

    const start = performance.now();

    const accountBalances: Record<string, number> = {};
    const cashByYear: Record<number, number> = {};
    const balances = this.prepareFSBalance();

    const csvFiles = await this.getCSVFiles({
      exclude: [
        ACCOUNT_REPORT_FILE_NAME,
        FS_REPORT_FILE_NAME,
        YEARLY_REPORT_FILE_NAME,
      ],
    });

    const fileContents = await this.readFiles({ files: csvFiles });
    fileContents.forEach((content) => {
      const lines = content.trim().split('\n');

      for (const line of lines) {
        const [date, account, , debit, credit] = line.split(',');
        const debitVal = parseFloat(debit || '0');
        const creditVal = parseFloat(credit || '0');
        const balance = debitVal - creditVal;

        // accounts operations
        accountBalances[account] = (accountBalances[account] || 0) + balance;

        // yearly operations
        if (account === 'Cash') {
          const year = new Date(date).getFullYear();
          if (!cashByYear[year]) {
            cashByYear[year] = 0;
          }
          cashByYear[year] += balance;
        }

        // fs operations
        if (Object.hasOwn(balances, account)) {
          balances[account] += balance;
        }
      }
    });

    const [accountsOutput, yearlyOutput, fsOutput] = [
      this.generateAccountsReport(accountBalances),
      this.generateYearlyReport(cashByYear),
      this.generateFSReport(balances),
    ];

    await Promise.all([
      fs.promises.writeFile(ACCOUNT_REPORT_PATH, accountsOutput.join('\n')),
      fs.promises.writeFile(YEARLY_REPORT_PATH, yearlyOutput.join('\n')),
      fs.promises.writeFile(FS_REPORT_PATH, fsOutput.join('\n')),
    ]);

    const duration = ((performance.now() - start) / 1000).toFixed(2);
    this.states.accounts = `finished in ${duration}s`;
    this.states.yearly = `finished in ${duration}s`;
    this.states.fs = `finished in ${duration}s`;
  }

  async accounts() {
    this.states.accounts = 'starting';
    const start = performance.now();

    const accountBalances: Record<string, number> = {};

    const csvFiles = await this.getCSVFiles({
      exclude: [ACCOUNT_REPORT_FILE_NAME],
    });

    const fileContents = await this.readFiles({ files: csvFiles });
    fileContents.forEach((content) => {
      const lines = content.trim().split('\n');

      for (const line of lines) {
        const [, account, , debit, credit] = line.split(',');
        const debitVal = parseFloat(debit || '0');
        const creditVal = parseFloat(credit || '0');
        const balance = debitVal - creditVal;

        accountBalances[account] = (accountBalances[account] || 0) + balance;
      }
    });

    const output = this.generateAccountsReport(accountBalances);
    fs.writeFileSync(ACCOUNT_REPORT_PATH, output.join('\n'));
    this.states.accounts = `finished in ${((performance.now() - start) / 1000).toFixed(2)}`;
  }

  async yearly() {
    this.states.yearly = 'starting';
    const start = performance.now();

    const cashByYear: Record<string, number> = {};

    const csvFiles = await this.getCSVFiles({
      exclude: [YEARLY_REPORT_FILE_NAME],
    });

    const fileContents = await this.readFiles({ files: csvFiles });
    fileContents.forEach((content) => {
      const lines = content.trim().split('\n');

      for (const line of lines) {
        const [date, account, , debit, credit] = line.split(',');
        if (account !== 'Cash') continue;

        const debitVal = parseFloat(debit || '0');
        const creditVal = parseFloat(credit || '0');
        const balance = debitVal - creditVal;

        const year = new Date(date).getFullYear();
        cashByYear[year] = (cashByYear[year] || 0) + balance;
      }
    });

    const output = this.generateYearlyReport(cashByYear);
    fs.writeFileSync(YEARLY_REPORT_PATH, output.join('\n'));
    this.states.yearly = `finished in ${((performance.now() - start) / 1000).toFixed(2)}`;
  }

  async fs() {
    this.states.fs = 'starting';
    const start = performance.now();
    const outputFile = 'out/fs.csv';

    const balances = this.prepareFSBalance();
    const csvFiles = await this.getCSVFiles({
      exclude: [YEARLY_REPORT_FILE_NAME],
    });

    const fileContents = await this.readFiles({ files: csvFiles });
    fileContents.forEach((content) => {
      const lines = content.trim().split('\n');

      for (const line of lines) {
        const [, account, , debit, credit] = line.split(',');
        const debitVal = parseFloat(debit || '0');
        const creditVal = parseFloat(credit || '0');
        const balance = debitVal - creditVal;

        if (Object.hasOwn(balances, account)) {
          balances[account] += balance;
        }
      }
    });

    const output = this.generateFSReport(balances);
    fs.writeFileSync(outputFile, output.join('\n'));
    this.states.fs = `finished in ${((performance.now() - start) / 1000).toFixed(2)}`;
  }

  private async getCSVFiles({
    exclude,
  }: {
    exclude: string[];
  }): Promise<string[]> {
    const files = await fs.promises.readdir(TMP_DIR);
    return files.filter(
      (file) => file.endsWith('.csv') && !exclude.includes(file),
    );
  }

  private async readFiles({ files }: { files: string[] }) {
    return Promise.all(
      files.map((file) =>
        fs.promises.readFile(path.join(TMP_DIR, file), 'utf-8'),
      ),
    );
  }

  private generateAccountsReport(accountBalances: Record<string, number>) {
    return [
      'Account,Balance',
      ...Object.entries(accountBalances).map(
        ([account, balance]) => `${account},${balance.toFixed(2)}`,
      ),
    ];
  }

  private generateYearlyReport(cashByYear: Record<number, number>) {
    return [
      'Financial Year,Cash Balance',
      ...Object.keys(cashByYear)
        .map(Number)
        .sort((a, b) => a - b)
        .map((year) => `${year},${cashByYear[year].toFixed(2)}`),
    ];
  }

  private prepareFSBalance() {
    const balances: Record<string, number> = {};
    for (const section of Object.values(FS_CATEGORIES)) {
      for (const group of Object.values(section)) {
        for (const account of group) {
          balances[account] = 0;
        }
      }
    }

    return balances;
  }

  private generateFSReport(balances: Record<string, number>) {
    const output: string[] = [];
    output.push('Basic Financial Statement');
    output.push('');
    output.push('Income Statement');
    let totalRevenue = 0;
    let totalExpenses = 0;
    for (const account of FS_CATEGORIES['Income Statement']['Revenues']) {
      const value = balances[account] || 0;
      output.push(`${account},${value.toFixed(2)}`);
      totalRevenue += value;
    }
    for (const account of FS_CATEGORIES['Income Statement']['Expenses']) {
      const value = balances[account] || 0;
      output.push(`${account},${value.toFixed(2)}`);
      totalExpenses += value;
    }
    output.push(`Net Income,${(totalRevenue - totalExpenses).toFixed(2)}`);
    output.push('');
    output.push('Balance Sheet');
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    output.push('Assets');
    for (const account of FS_CATEGORIES['Balance Sheet']['Assets']) {
      const value = balances[account] || 0;
      output.push(`${account},${value.toFixed(2)}`);
      totalAssets += value;
    }
    output.push(`Total Assets,${totalAssets.toFixed(2)}`);
    output.push('');
    output.push('Liabilities');
    for (const account of FS_CATEGORIES['Balance Sheet']['Liabilities']) {
      const value = balances[account] || 0;
      output.push(`${account},${value.toFixed(2)}`);
      totalLiabilities += value;
    }
    output.push(`Total Liabilities,${totalLiabilities.toFixed(2)}`);
    output.push('');
    output.push('Equity');
    for (const account of FS_CATEGORIES['Balance Sheet']['Equity']) {
      const value = balances[account] || 0;
      output.push(`${account},${value.toFixed(2)}`);
      totalEquity += value;
    }
    output.push(
      `Retained Earnings (Net Income),${(totalRevenue - totalExpenses).toFixed(2)}`,
    );
    totalEquity += totalRevenue - totalExpenses;
    output.push(`Total Equity,${totalEquity.toFixed(2)}`);
    output.push('');
    output.push(
      `Assets = Liabilities + Equity, ${totalAssets.toFixed(2)} = ${(totalLiabilities + totalEquity).toFixed(2)}`,
    );

    return output;
  }
}
