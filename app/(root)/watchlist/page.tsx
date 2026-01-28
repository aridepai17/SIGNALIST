import { getUserWatchlist } from "@/lib/actions/watchlist.actions";
import WatchlistTable from "@/components/WatchlistTable";

export default async function WatchlistPage() {
	const watchlist = await getUserWatchlist();

	return (
		<div className="flex flex-col gap-6">
			<h1 className="text-2xl font-bold text-gray-100">Your Watchlist</h1>

			{watchlist.length === 0 ? (
				<div className="text-center py-16 text-gray-400">
					<p className="text-lg">Your watchlist is empty.</p>
					<p className="text-sm mt-2">
						Search for stocks and add them to your watchlist to track
						them here.
					</p>
				</div>
			) : (
				<WatchlistTable watchlist={watchlist} />
			)}
		</div>
	);
}
