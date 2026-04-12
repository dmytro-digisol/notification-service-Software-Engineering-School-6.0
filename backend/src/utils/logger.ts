import winston from "winston";

const logLevel = process.env.LOG_LEVEL || "info";

const logger = winston.createLogger({
	level: logLevel,
	format: winston.format.combine(
		winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
		winston.format.errors({ stack: true }),
		winston.format.json(),
	),
	defaultMeta: { service: "notification-service" },
	transports: [
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.printf(
					({ timestamp, level, message, service, ...meta }) => {
						let msg = `${timestamp} [${service}] ${level}: ${message}`;
						if (Object.keys(meta).length > 0) {
							const serialized = JSON.stringify(meta, (_key, value) => {
								if (value instanceof Error) {
									return { ...value, message: value.message, stack: value.stack };
								}
								return value;
							});
							msg += ` ${serialized}`;
						}
						return msg;
					},
				),
			),
		}),
	],
});

export default logger;
