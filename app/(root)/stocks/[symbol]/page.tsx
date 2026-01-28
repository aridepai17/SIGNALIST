import TradingViewWidget from "@/components/TradingViewWidget";
import WatchlistButton from "@/components/WatchlistButton";
import { isSymbolInWatchlist } from "@/lib/actions/watchlist.actions";
import {
	SYMBOL_INFO_WIDGET_CONFIG,
	CANDLE_CHART_WIDGET_CONFIG,
	BASELINE_WIDGET_CONFIG,
	TECHNICAL_ANALYSIS_WIDGET_CONFIG,
	COMPANY_PROFILE_WIDGET_CONFIG,
	COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";

export default async function StockDetails({ params }: StockDetailsPageProps) {
	const { symbol } = await params;
	const inWatchlist = await isSymbolInWatchlist(symbol);
	const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

	// Widget container styles
	const widgetContainer = "bg-gray-900 rounded-lg overflow-hidden shadow-lg";

	return (
		<div className="min-h-screen bg-gray-950 px-4 py-6 md:px-8 md:py-8">
			<div className="max-w-[1400px] mx-auto space-y-4">
				{/* Symbol Info */}
				<div className={widgetContainer}>
					<TradingViewWidget
						scriptUrl={`${scriptUrl}symbol-info.js`}
						config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
						height={180}
					/>
				</div>

				{/* Watchlist */}
				<div>
					<WatchlistButton
						symbol={symbol.toUpperCase()}
						company={symbol.toUpperCase()}
						isInWatchlist={inWatchlist}
					/>
				</div>

				{/* Main Chart */}
				<div className={widgetContainer}>
					<TradingViewWidget
						scriptUrl={`${scriptUrl}advanced-chart.js`}
						config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
						height={550}
					/>
				</div>

				{/* Technical Analysis */}
				<div className={widgetContainer}>
					<TradingViewWidget
						scriptUrl={`${scriptUrl}technical-analysis.js`}
						config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
						height={420}
					/>
				</div>

				{/* Company Profile */}
				<div className={widgetContainer}>
					<TradingViewWidget
						scriptUrl={`${scriptUrl}company-profile.js`}
						config={COMPANY_PROFILE_WIDGET_CONFIG(symbol)}
						height={420}
					/>
				</div>

				{/* Baseline Chart */}
				<div className={widgetContainer}>
					<TradingViewWidget
						scriptUrl={`${scriptUrl}advanced-chart.js`}
						config={BASELINE_WIDGET_CONFIG(symbol)}
						height={450}
					/>
				</div>

				{/* Financials — full width, no scrollbar */}
				<div className={widgetContainer}>
					<TradingViewWidget
						scriptUrl={`${scriptUrl}financials.js`}
						config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
						height={550}
					/>
				</div>
			</div>
		</div>
	);
}
