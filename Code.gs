function doGet(e) {
  // Settlement price lookup (Yahoo Finance, server-side)
  if (e && e.parameter && e.parameter.action === 'settlement') {
    return getSettlementPrice(e);
  }

  const tabName = (e && e.parameter && e.parameter.tab) ? e.parameter.tab : 'Data';
  const sheet   = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tabName);
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: 'Tab not found: ' + tabName }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const data    = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const rows    = data.slice(1)
    .filter(row => row[0] !== '')
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        const val = row[i];
        obj[h] = val instanceof Date
          ? Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd')
          : val;
      });
      return obj;
    });
  return ContentService
    .createTextOutput(JSON.stringify({ data: rows }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSettlementPrice(e) {
  var ticker = e.parameter.ticker || '^GSPC';
  var dateStr = e.parameter.date;

  if (!dateStr) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'date param required' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var d = new Date(dateStr + 'T12:00:00Z');
  var from = Math.floor(d.getTime() / 1000) - 86400;
  var to = Math.floor(d.getTime() / 1000) + 172800;

  var url = 'https://query1.finance.yahoo.com/v8/finance/chart/'
    + encodeURIComponent(ticker)
    + '?period1=' + from
    + '&period2=' + to
    + '&interval=1d';

  try {
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var json = JSON.parse(response.getContentText());
    var result = json.chart.result[0];
    var timestamps = result.timestamp;
    var closes = result.indicators.quote[0].close;

    var targetTs = d.getTime() / 1000;
    var best = -1;
    for (var i = 0; i < timestamps.length; i++) {
      if (timestamps[i] <= targetTs + 86400) best = i;
    }

    var close = best >= 0 ? closes[best] : null;

    return ContentService.createTextOutput(JSON.stringify({ ticker: ticker, date: dateStr, close: close }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
