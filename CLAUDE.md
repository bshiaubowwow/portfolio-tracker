# Portfolio Tracker

Single HTML file dashboard for tracking multi-account investments and day trading performance.

## Architecture

- `index.html` — entire app, no build step, no dependencies beyond Google Fonts
- Data served via Google Apps Script from Google Sheet (ID: `1E6pQbQBMdZrwYAB7zRbKSVqT6bOdP0r4I`)
- Apps Script accepts `?tab=` param to serve different sheet tabs as JSON
- GitHub repo: https://github.com/bshiaubowwow/portfolio-tracker

## Sheet Tabs & Column Names

**Data** — weekly portfolio balances (portfolio tab)
- Main columns: Date, Total Port. Value, $ change, % Change, Total Alpha, Net Transfers out of Trading Portfolio
- Per-account balance columns: Webull Brokerage, Webull Futures, Fidelity Core, Fidelity Options, Vanguard IRA, Fidelity 401K, HSA, Fidelity CMA
- Per-account alpha columns: e.g. "Webull Brokerage Alpha"
- Per-account transfer columns: e.g. "Webull Net Transfers"

**WB Brokerage Trades** — raw Webull fill exports (paste-over, never manually edit rows)
- Columns: Symbol, Side (Buy/Sell), Filled, Avg Price, Filled Time, Status
- Timestamps are in ET with timezone abbreviations (EDT/EST) — strip with `.replace(/\s+[A-Z]{2,4}$/, '')`
- Some Avg Price cells have `@` prefix — strip before parseFloat
- Status must be "Filled"

**WB Daily** — daily opening balance for the day trading account
- Columns (case-sensitive): `Date`, `Starting Balance`, `Risk %`
- Date format in sheet: `8/5/2026` (M/D/YYYY) — code normalizes to YYYY-MM-DD
- Risk % is a Google Sheets percentage (stored as decimal, e.g. 1 = 100%)
- Risk % forward-fills — only add a new value when strategy changes
- Default risk is 100% (sizing for zero / full premium loss)

## Two Tabs

### Portfolio Tab
- Balance chart with account filters, pie chart, account cards grouped by intent (Tactical/Positions/Retirement/Cash)
- Date range toggles, group mode toggle

### Trades Tab
Core sections in order:
1. **Filter bar** — date presets, custom range, Day/Swing/All, Calls/Puts/All, ticker pills
2. **Today (scorecard)** — today's P&L ($, %), trades, WR, total R
3. **Edge** — Total P&L (with account return %), Win Rate, Trades, R:R, Breakeven WR
4. **Risk & Sizing + Discipline** — side by side tables, All vs Last 10 with delta arrows
5. **Equity Curve** — P&L ($/%)/R toggle, daily aggregation, adaptive X-axis, tooltip
6. **Performance by Factor** — dropdown (Trades per Day, Position Size, Trade # in Day)
7. **Performance by Time of Day** — 30-min buckets, ET→PT conversion, day trades only
8. **Open Positions**
9. **Trade Log** — sortable, columns: Opened, W/L, Style, Underlying, Type, Strike, Expiry, P&L, R, Size%, Cost Basis, Qty, Closed, Days Held

## Key Calculations

- **R multiple** = P&L / (cost basis × risk %). At 100% risk, R = P&L / cost basis
- **Size %** = cost basis / daily opening balance
- **R:R** = avg winning R / |avg losing R|, displayed as risk:reward (1:X)
- **Breakeven WR** = 1 / (1 + reward/risk) × 100
- **Account Return %** = total P&L / starting balance for the period
- Trades are aggregated at contract level (same option symbol = one trade regardless of adds/trims)
- Day trade = daysHeld === 0 (all lots opened and closed same day)
- Hold time stored in milliseconds for sub-day precision

## Important Quirks

- Webull doesn't generate sell fills for expired options — code detects and auto-closes as worthless
- SPXW/SPX/XSP ITM expirations: fetched via Yahoo Finance through allorigins.win CORS proxy, cached in localStorage
- Alpha values in Data sheet are per-period (not cumulative) — must skip starting row with `.slice(1)`
- `parseTradeDate()` strips timezone abbreviations before parsing
- Header stats switch between portfolio and trades view
- Filters (date, type, ticker, option type) all stack and affect every section

## Upcoming

- Daily loss limit tracking (rule not yet defined by user)
- Monte Carlo projected equity curve (needs 20+ trades first)

## User Context

- Ben is on PST — times are converted from ET (subtract 3 hours)
- Primarily trades SPY/SPX/SPXW 0DTE options
- Day trading with occasional swings
- Risk is 100% (sizing for full premium loss)
- WB Daily tab is manually entered each trading day
- WB Brokerage Trades is a paste-over from Webull export (never manually add rows)
