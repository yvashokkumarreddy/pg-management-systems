const requiredEnvVariables = [
  "DATABASE_URL",
];

for (const variable of requiredEnvVariables) {
  if (!process.env[variable]) {
    throw new Error(
      `Missing required environment variable: ${variable}`
    );
  }
}

export const env = {
  databaseUrl: process.env.DATABASE_URL,
  nodeEnv: process.env.NODE_ENV || "development",
};