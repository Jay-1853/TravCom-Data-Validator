# ✈️📊 Automated TravCom Data Integrity Alerts

## Overview

This project uses Google Apps Script to proactively detect and notify about a common data entry error in **TravCom** accounting software used in travel agencies: transactions with future dates. It automates daily database checks to ensure cleaner data for analysis in BI tools and warehousing.

---

## ⚠️ The Problem: Skewed Data & Wasted Time

Accountants often manually enter "non-BSP" transactions into TravCom. A frequent mistake is inputting a future date for a past or current transaction.

*   ❌ **Corrupts Power BI Reports:** Future dates skew data, making financial analysis unreliable.
*   ⏰ **Time-Consuming Manual Checks:** Impossible to check every entry daily, leading to delayed discovery.
*   📉 **Impacts Decision Making:** Flawed data leads to poor business insights.

---

## ⚙️ The Solution: Daily Automated Validation

This script automates the tedious daily checks:

1.  **Connects:** Establishes a secure connection to the TravCom SQL Server database or another database of your choosing.
2.  **Queries:** Runs a targeted SQL query to find transactions where `TransactionDate` is in the future and `TransactionType` is `1` (a valid transaction).
3.  **Notifies:** If errors are found, it generates a clear, HTML email.
4.  **Highlights:** The email includes a table detailing every problematic transaction, crucially showing **which accountant made the entry**.
5.  **Alerts:** Sends this alert to the finance team's email inbox every morning.

---

## 🏆 Achievements & Impact

Since implementation, the results have been significant:

*   📈 **Errors Drastically Reduced:** Daily, targeted alerts prompt immediate corrections, significantly lowering error frequency.
*   ✅ **Enhanced Data Accuracy:** Power BI dashboards and data warehouse now reflect reliable data, improving financial insights.
*   🚀 **Increased Team Efficiency:** No more manual checks; accountants can focus on high-value tasks.
*   🤝 **Improved Accountability:** Identifying the responsible accountant fosters better data entry practices.

---

## 🧠 How It Works (Under the Hood)

1.  **Connects:** `Jdbc.getConnection` to SQL Server.
2.  **Executes Query:** `SELECT` future-dated non-BSP transactions and `Accountant` from `ARInvoiceDetails`.
3.  **Processes Results:** Iterates through results, formats dates, and compiles data into an array.
4.  **Builds Email:** Constructs an HTML email with a table of errors.
5.  **Sends Alert:** `GmailApp.sendEmail` to the finance team.
6.  **Error Handling:** `try-catch-finally` block logs issues and sends admin alerts.

---

## 🚀 Setup & Deployment

1.  **Create Google Apps Script Project:** Go to `script.google.com`.
2.  **Copy Code:** Paste the provided JavaScript code into `Code.gs`.
3.  **Configure Credentials:** Update database `<HOST>`, `<DB_NAME>`, `<USERNAME>`, and `<PASSWORD>`.
4.  **Enable Services:** Add `JDBC` and `Gmail API` services in the Apps Script editor.
5.  **Set Trigger:** Create a "Time-driven" trigger for `checkFutureTransactionsAndNotify` to run daily between `9 AM - 10 AM` or any other time you may choose.
6.  **Authorize:** Grant necessary permissions when prompted.