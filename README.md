# The American Economy: Presidents, Policies & Economic Cycles

An interactive quarterly atlas of the United States since 1948. The four aligned charts place output, unemployment, prices and interest rates alongside presidential tenures and monthly NBER recessions. Use the distribution chart to compare the quarters observed in each administration. Use the scatterplot to explore whether two indicators moved together within a selected period.

## Run locally

From the directory containing index.html, run `python -m http.server 8000` and visit http://localhost:8000/. The application reads local JSON. Vega, Vega-Lite and Vega-Embed are bundled under vendor, with their licenses. There is no build step or API key.

## Reading the data

- Real GDP growth equals 100 × (GDPC1 this quarter / GDPC1 four quarters earlier − 1). BEA publishes the level at a seasonally adjusted annual rate.
- Unemployment is the arithmetic mean of three monthly BLS UNRATE observations.
- CPI inflation is the mean of three monthly 100 × (CPIAUCSL / CPIAUCSL twelve months earlier − 1) values. UNRATE and CPIAUCSL are seasonally adjusted.
- The effective federal funds rate is the mean of three monthly FEDFUNDS observations, in percent. There is no historical proxy before July 1954.
- Three monthly observations are required for a quarterly mean. Missing values are excluded separately for each indicator. Scatterplots require both coordinates.
- A point is drawn at the beginning of the quarter it represents. Its administration is determined on the quarter’s last day. Actual tenure boundaries and monthly recession boundaries are drawn at their calendar dates. See [historical sources](data/history.md).
- Box edges are interpolated 25th and 75th percentiles, the tick is the median, and whiskers run from minimum to maximum. Each available quarter has equal weight. Hover to check counts, especially for truncated or short tenures.
- Observed associations combine inherited conditions, global shocks, monetary policy and other influences. They cannot identify presidential policy effects.

## Publish on GitHub Pages

Put this directory’s contents at the root of a GitHub repository and push to main. Under Settings → Pages → Build and deployment, choose Deploy from a branch, main and / (root), then Save. Open the URL GitHub reports after the deployment succeeds.

## Snapshot verification

The 14 November 2026 snapshot contains 315 consecutive quarters from 1948 Q1 through 2026 Q3. The FRED export includes October 2026 monthly values, which belong to an unfinished quarter. GDP has 315 values, unemployment and inflation each have 314, and the funds rate has 289. October 2025 is missing for UNRATE and CPIAUCSL, leaving both 2025 Q4 aggregates blank. The last complete quarter has 2.066% GDP growth, 4.133% unemployment, 3.458% CPI inflation and a 3.670% effective funds rate.

The [original FRED export](data/fred-export.zip) preserves the levels used for the calculations. [Download the same series from FRED](https://fred.stlouisfed.org/graph/fredgraph.csv?id=GDPC1,UNRATE,CPIAUCSL,FEDFUNDS). Later releases may revise past observations.
