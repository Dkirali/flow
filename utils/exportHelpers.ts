import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import * as Print from 'expo-print'
import Papa from 'papaparse'
import type { Transaction } from '@/types/transaction'

interface BudgetSummary {
  totalIncome: number
  totalExpenses: number
  netSavings: number
  dailyBudget: number
}

/**
 * Export transactions to CSV format and share
 */
export async function exportToCSV(transactions: Transaction[]): Promise<void> {
  // Convert transactions to CSV
  const csvData = transactions.map((t) => ({
    Date: t.date,
    Time: t.time,
    Type: t.type,
    Category: t.category,
    Amount: t.amount,
    Currency: t.currencyCode,
    Note: t.note || '',
    Mandatory: t.isMandatory ? 'Yes' : 'No',
    Leisure: t.isLeisure ? 'Yes' : 'No',
    Recurring: t.isRecurring ? 'Yes' : 'No',
  }))

  const csv = Papa.unparse(csvData, {
    header: true,
  })

  // Write to file
  const fileName = `flow-transactions-${new Date().toISOString().split('T')[0]}.csv`
  const filePath = `${FileSystem.cacheDirectory}${fileName}`

  await FileSystem.writeAsStringAsync(filePath, csv)

  // Share the file
  await Sharing.shareAsync(filePath, {
    mimeType: 'text/csv',
    dialogTitle: 'Export Transactions',
  })
}

/**
 * Export transactions and summary to PDF and share
 */
export async function exportToPDF(
  transactions: Transaction[],
  summary: BudgetSummary
): Promise<void> {
  // Generate HTML content
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #6C63FF; }
          h2 { color: #333; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #6C63FF; color: white; padding: 10px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          .summary { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .income { color: #00C9A7; }
          .expense { color: #FF6B6B; }
        </style>
      </head>
      <body>
        <h1>FLŌW Budget Report</h1>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
        
        <div class="summary">
          <h2>Summary</h2>
          <p><strong>Total Income:</strong> $${summary.totalIncome.toFixed(2)}</p>
          <p><strong>Total Expenses:</strong> $${summary.totalExpenses.toFixed(2)}</p>
          <p><strong>Net Savings:</strong> $${summary.netSavings.toFixed(2)}</p>
          <p><strong>Daily Budget:</strong> $${summary.dailyBudget.toFixed(2)}</p>
        </div>
        
        <h2>Transactions</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            ${transactions
              .map(
                (t) => `
              <tr>
                <td>${t.date}</td>
                <td class="${t.type}">${t.type}</td>
                <td>${t.category}</td>
                <td>$${t.amount.toFixed(2)}</td>
                <td>${t.note || '-'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `

  // Generate PDF
  const { uri } = await Print.printToFileAsync({ html })

  // Share the file
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Export Budget Report',
  })
}
