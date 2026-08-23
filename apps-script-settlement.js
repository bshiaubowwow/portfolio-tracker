// ══════════════════════════════════════════════════════════════
// ADD THIS TO YOUR EXISTING Google Apps Script (Code.gs)
//
// This adds a settlement price endpoint so the dashboard can
// look up SPX closing prices without a CORS proxy.
//
// After adding, click Deploy > Manage Deployments > Edit >
// Version: "New version" > Deploy
// ══════════════════════════════════════════════════════════════

// Add this block INSIDE your existing doGet(e) function,
// BEFORE the existing tab-serving logic:
//
//   if (e.parameter.action === 'settlement') {
//     return getSettlementPrice(e);
//   }
//
// Then add this function anywhere in the file:

function getSettlementPrice(e) {
  var ticker = e.parameter.ticker || '^GSPC';
  var dateStr = e.parameter.date; // e.g. "2026-01-15"

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
