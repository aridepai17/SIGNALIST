import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectToDatabase } from "@/database/mongoose";
import { nextCookies } from "better-auth/next-js";

let authPromise: Promise<ReturnType<typeof betterAuth>> | null = null;

export const getAuth = () => {
	if (!authPromise) {
		authPromise = connectToDatabase()
			.then((mongoose) => {
				const db = mongoose.connection.db;
				if (!db) throw new Error("MongoDB connection not found");

				return betterAuth({
					database: mongodbAdapter(db as unknown as Parameters<typeof mongodbAdapter>[0]),
					secret: process.env.BETTER_AUTH_SECRET,
					baseURL: process.env.BETTER_AUTH_URL,
					emailAndPassword: {
						enabled: true,
						disabledSignUp: false,
						requireEmailVerification: false,
						minPasswordLength: 8,
						maxPasswordLength: 128,
						autoSignIn: true,
					},
					plugins: [nextCookies()],
				});
			})
			.catch((err) => {
				authPromise = null;
				throw err;
			});
	}

	return authPromise;
};
