"use server";

import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";
import { getAuth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { fetchJSON } from "@/lib/actions/finnhub.actions";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY ?? "";

export async function getWatchlistSymbolsByEmail(
	email: string,
): Promise<string[]> {
	if (!email) return [];

	try {
		const mongoose = await connectToDatabase();
		const db = mongoose.connection.db;
		if (!db) throw new Error("MongoDB connection not found");

		// Better Auth stores users in the 'user' collection

		const user = await db
			.collection("user")
			.findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

		if (!user) return [];

		const userId = (user.id as string) || String(user._id || "");
		if (!userId) return [];

		const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
		return items.map((i) => String(i.symbol));
	} catch (err) {
		console.error("getWatchlistSymbolsByEmail", err);
		return [];
	}
}

async function getSessionUserId(): Promise<string | null> {
	try {
		const auth = await getAuth();
		const session = await auth.api.getSession({
			headers: await headers(),
		});
		if (!session?.user?.email) return null;

		const mongoose = await connectToDatabase();
		const db = mongoose.connection.db;
		if (!db) return null;

		const user = await db
			.collection("user")
			.findOne<{ _id?: unknown; id?: string }>({
				email: session.user.email,
			});
		if (!user) return null;

		return (user.id as string) || String(user._id || "") || null;
	} catch {
		return null;
	}
}

export async function addToWatchlist(symbol: string, company: string) {
	try {
		const userId = await getSessionUserId();
		if (!userId) return { success: false, error: "Not authenticated" };

		await connectToDatabase();
		await Watchlist.create({
			userId,
			symbol: symbol.toUpperCase(),
			company,
		});

		revalidatePath("/watchlist");
		return { success: true };
	} catch (err: any) {
		if (err?.code === 11000) return { success: true }; // already exists
		console.error("addToWatchlist", err);
		return { success: false, error: "Failed to add to watchlist" };
	}
}

export async function removeFromWatchlist(symbol: string) {
	try {
		const userId = await getSessionUserId();
		if (!userId) return { success: false, error: "Not authenticated" };

		await connectToDatabase();
		await Watchlist.deleteOne({ userId, symbol: symbol.toUpperCase() });

		revalidatePath("/watchlist");
		return { success: true };
	} catch (err) {
		console.error("removeFromWatchlist", err);
		return { success: false, error: "Failed to remove from watchlist" };
	}
}

export async function isSymbolInWatchlist(symbol: string): Promise<boolean> {
	try {
		const userId = await getSessionUserId();
		if (!userId) return false;

		await connectToDatabase();
		const doc = await Watchlist.findOne({
			userId,
			symbol: symbol.toUpperCase(),
		});
		return !!doc;
	} catch {
		return false;
	}
}

export async function getUserWatchlist(): Promise<StockWithData[]> {
	try {
		const userId = await getSessionUserId();
		if (!userId) return [];

		await connectToDatabase();
		const items = await Watchlist.find({ userId }).lean();
		if (!items.length) return [];

		const token = FINNHUB_API_KEY;
		if (!token) return items.map((i) => ({
			userId: i.userId,
			symbol: String(i.symbol),
			company: i.company,
			addedAt: i.addedAt,
		}));

		const enriched = await Promise.allSettled(
			items.map(async (item) => {
				const sym = String(item.symbol);
				const [quote, profile, metrics] = await Promise.allSettled([
					fetchJSON<any>(
						`${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(sym)}&token=${token}`,
						60,
					),
					fetchJSON<any>(
						`${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`,
						3600,
					),
					fetchJSON<any>(
						`${FINNHUB_BASE_URL}/stock/metric?symbol=${encodeURIComponent(sym)}&metric=all&token=${token}`,
						3600,
					),
				]);

				const q = quote.status === "fulfilled" ? quote.value : null;
				const p = profile.status === "fulfilled" ? profile.value : null;
				const m = metrics.status === "fulfilled" ? metrics.value : null;

				const currentPrice = q?.c ?? undefined;
				const changePercent = q?.dp ?? undefined;
				const marketCapRaw = p?.marketCapitalization;
				const peRaw = m?.metric?.peBasicExclExtraTTM;

				let marketCap: string | undefined;
				if (marketCapRaw != null) {
					marketCap =
						marketCapRaw >= 1000
							? `$${(marketCapRaw / 1000).toFixed(2)}T`
							: marketCapRaw >= 1
								? `$${marketCapRaw.toFixed(2)}B`
								: `$${(marketCapRaw * 1000).toFixed(2)}M`;
				}

				const result: StockWithData = {
					userId: item.userId,
					symbol: sym,
					company: p?.name || item.company,
					addedAt: item.addedAt,
					currentPrice,
					changePercent,
					priceFormatted: currentPrice != null ? `$${currentPrice.toFixed(2)}` : undefined,
					changeFormatted: changePercent != null
						? `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}%`
						: undefined,
					marketCap,
					peRatio: peRaw != null ? peRaw.toFixed(2) : "N/A",
				};
				return result;
			}),
		);

		return enriched
			.filter(
				(r): r is PromiseFulfilledResult<StockWithData> =>
					r.status === "fulfilled",
			)
			.map((r) => r.value);
	} catch (err) {
		console.error("getUserWatchlist", err);
		return [];
	}
}
