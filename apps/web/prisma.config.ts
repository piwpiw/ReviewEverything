import { defineConfig } from '@prisma/config'

// Fixes missing DB connection variables if required in Prisma newer configs.
export default defineConfig({
    earlyAccess: true, // Required for v6 configurations
})
