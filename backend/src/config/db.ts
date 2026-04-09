import mongoose from "mongoose";
import logger from "../utils/logger.js";

const uri = process.env.MONGODB_URI || "";

export const connectDB = async (): Promise<void> => {
	try {
		await mongoose.connect(uri);
		logger.info("MongoDB connected");
	} catch (err) {
		logger.error("MongoDB connection error", {
			error: err,
		});
		process.exit(1);
	}
};
