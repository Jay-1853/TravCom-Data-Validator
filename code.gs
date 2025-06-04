function checkFutureTransactionsAndNotify() {
  // This section sets up the connection to the database.
  // It uses a JDBC connection to talk to a SQL Server, providing the host, database name, username, and password.
  const conn = Jdbc.getConnection(
    'jdbc:sqlserver://<HOST>;databaseName=<DB_NAME>',
    '<USERNAME>',
    '<PASSWORD>'
  );

  // Here, we define the SQL query that will be used to fetch data.
  // This particular query looks for transactions where the date is in the future
  // and the transaction type is '1' (an actual sale).,
  // joining with the Users table to get the accountant's name.
  // You can write your own SQL query to suit your needs.
  const sql = `
    SELECT 
      ard.VendorName, 
      ard.PassengerName, 
      ard.TicketNumber, 
      ard.TransactionDate,
      u.UserName as Accountant
    FROM 
      ARInvoiceDetails   ard
    LEFT JOIN Users u ON ard.AddedBy = u.UserID
    WHERE 
      ard.TransactionDate > CAST(GETDATE() AS DATE) AND ard.TransactionType = 1
  `;

  // This is where we specify the email address for the finance team,
  // who will receive the alert if any future-dated transactions are found.
  const email = 'finance-team@example.com'

  // This 'try' block contains the main logic of the script.
  // If anything goes wrong during this process, it will jump to the 'catch' block.
  try {
    // We create a statement object to execute our SQL query.
    const stmt = conn.createStatement();
    // Then, we run the query against the database and get the results.
    const results = stmt.executeQuery(sql);

    // We'll store the relevant transaction data in this array,
    // which will later be used to build the email content.
    let rows = [];
    // This loop goes through each row returned by our database query.
    while (results.next()) {
      // We grab the transaction date from the database.
      const invoiceDateFromDb = results.getObject("TransactionDate");
      let formattedDate = "N/A";

      // This part checks if the date is valid and formats it nicely for the email.
      // It also logs warnings if the date can't be parsed or is missing.
      if (invoiceDateFromDb) {
        const jsDate = new Date(invoiceDateFromDb);
        if (!isNaN(jsDate.getTime())) {
          formattedDate = Utilities.formatDate(jsDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
        } else {
          Logger.log("Warning: Could not parse InvoiceDate for InvoiceID " + results.getString("InvoiceID") + ". Raw value: " + invoiceDateFromDb);
        }
      } else {
        Logger.log("Warning: InvoiceDate is null for InvoiceID " + results.getString("InvoiceID"));
      }

      // We gather all the relevant pieces of information for the current transaction
      // and put them into a neat object.
      const row = {
        vendor: results.getString("VendorName"),
        passenger: results.getString("PassengerName"),
        date: formattedDate,
        ticketnumber: results.getString("TicketNumber"),
        accountant: results.getString("Accountant")
      };
      // Then, we add this object to our list of rows.
      rows.push(row);
    }

    // After we're done processing all the results, it's good practice to close
    // the database result set and the statement to free up resources.
    results.close();
    stmt.close();

    // This checks if we actually found any future-dated transactions.
    // If we did, an email alert will be sent.
    if (rows.length > 0) {
      // We fetch the default email signature of the sender to include it in the email.
      var signature = Gmail.Users.Settings.SendAs.list("me").sendAs.find(account => account.isDefault).signature;
      // We set the subject line for the alert email.
      const subject = "⚠️ Alert: Potential Data Entry Error";

      // This section is busy building the actual content of the email in HTML format.
      // It sets a specific font and size, includes a friendly message,
      // and then creates a table to display all the problematic transactions.
      let htmlBody = `
        <div style="font-family: Garamond, Georgia, serif; font-size: 18px;">
          <p>Dear Accountants,</p>
          <p>The following transactions in <strong>TravCom</strong> have a transaction date in the future (which is likely an error):</p><br>
          <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="text-align: left;">Vendor</th>
                <th style="text-align: left;">Passenger</th>
                <th style="text-align: left;">TicketNumber</th>
                <th style="text-align: left;">TransactionDate</th>
                <th style="text-align: left;">Accountant</th>
              </tr>
            </thead>
            <tbody>
      `;

      // For each transaction found, we add a new row to the HTML table.
      rows.forEach(row => {
        htmlBody += `
            <tr>
              <td>${row.vendor}</td>
              <td>${row.passenger}</td>
              <td>${row.ticketnumber}</td>
              <td>${row.date}</td>
              <td>${row.accountant}</td>
            </tr>
        `;
      });

      // We close off the HTML table and the main div, and add a concluding message.
      htmlBody += `
            </tbody>
          </table><br>
          <p>Please review and correct these entries as appropriate.</p>
        </div>
      `; // Closed the main div here

      // We combine the HTML body with the sender's signature.
      var body = htmlBody + "<br>" + signature;
      // Finally, we send the email to the finance team using GmailApp.
      GmailApp.sendEmail(email, subject, '', { htmlBody: body });

      // We log a message to confirm that the email was sent.
      Logger.log("Future-dated transactions email sent.");

    } else {
      // If no future-dated transactions were found, we just log a message saying so,
      // and no email is sent.
      Logger.log("No future-dated transactions found. No email sent.");
    }

  // This 'catch' block handles any errors that might occur within the 'try' block.
  } catch (error) {
    // We log the error details, including the message and the stack trace,
    // to help with debugging.
    Logger.log("Error: " + error.toString());
    Logger.log("Stack: " + error.stack);
    // In case of an error, an email is sent to an administrator
    // so they are aware that something went wrong with the script.
    MailApp.sendEmail("admin@example.com", "Script Error: checkFutureTransactionsAndNotify", "Error: " + error.toString() + "\nStack: " + error.stack);
  // The 'finally' block always runs, regardless of whether an error occurred or not.
  } finally {
    // This is crucial for resource management: it ensures that the database connection
    // is properly closed, even if an error happened during the script's execution.
    if (conn && !conn.isClosed()) {
      try {
        conn.close();
      } catch (e) {
        Logger.log("Error closing connection: " + e.message);
      }
    }
  }
}