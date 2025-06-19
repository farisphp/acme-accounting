import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import fs from 'fs';
import path from 'path';
import {
  ACCOUNT_REPORT_FILE_NAME,
  ACCOUNT_REPORT_PATH,
  FS_CATEGORIES,
  FS_REPORT_FILE_NAME,
  FS_REPORT_PATH,
  TMP_DIR,
  YEARLY_REPORT_FILE_NAME,
  YEARLY_REPORT_PATH,
} from 'src/reports/constants';
import {
  ACCOUNTS_JOB_NAME,
  ALL_REPORT_JOB_NAME,
  FS_JOB_NAME,
  REPORTS_QUEUE_NAME,
  YEARLY_JOB_NAME,
} from './constants';

@Processor(REPORTS_QUEUE_NAME)
export class ReportsConsumer extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case ALL_REPORT_JOB_NAME:
        await this.all();
        break;
      case ACCOUNTS_JOB_NAME:
        await this.accounts();
        break;
      case YEARLY_JOB_NAME:
        await this.yearly();
        break;
      case FS_JOB_NAME:
        await this.fs();
        break;
    }
    return {};
  }

  async all() {}

  async accounts() {
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
  }

  async yearly() {
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
  }

  async fs() {
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
