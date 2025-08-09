# Stockgraph

Stockgraph is a static, browser‑based dashboard that visualizes historical stock performance, compares returns against the S&P 500, and models future growth scenarios.

## File structure
- `index.html` – main HTML page for the dashboard
- `styles.css` – custom styling for the dashboard
- `js/` – JavaScript modules powering calculations and UI
- `data/` – JSON files with historical stock prices and S&P 500 closes

## Running locally
1. From the repository root start a local server (e.g., `python -m http.server`).
2. Open `http://localhost:8000/index.html` in your browser.

## Updating historical data
Update the JSON data files in the `data/` directory:
- `history.json` – stock price for each financial year
- `sp500.json` – S&P 500 closing value for each year

Add a new object with the latest year and values to each array and keep the list ordered by year.

## Dependencies
This project relies on the following libraries loaded via CDN in `index.html`:
- [Bootstrap 5](https://getbootstrap.com/) – layout and components
- [Plotly](https://plotly.com/javascript/) – interactive charts

No additional build steps are required.

## Disclaimer
This project does not offer financial advice. Data may be inaccurate or incomplete, and users assume all risk for investment decisions.
