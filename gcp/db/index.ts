import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

// Step 1: Define configuration values
const config = new pulumi.Config();
const region = config.require("region");
const password = config.require("dbPassword");

// Step 2: Create a Google Cloud SQL PostgreSQL instance
export const postgresInstance = new gcp.sql.DatabaseInstance("lamar-instance", {
  name: "lamar-instance",
  databaseVersion: "POSTGRES_16", // Choose the desired PostgreSQL version
  region: region,
  instanceType: "CLOUD_SQL_INSTANCE", // Create a new instance
  settings: {
    edition: "ENTERPRISE",
    diskSize: 10,
    diskAutoresize: true,
    diskType: "PD_HDD",
    tier: "db-custom-2-3840",
    deletionProtectionEnabled: false,
    ipConfiguration: {
      ipv4Enabled: true, // Enable public IP access (optional)
    },
    backupConfiguration: {
      enabled: true,
      startTime: "02:00", // Backup start time in UTC
    },
  },
});

// Step 3: Create a PostgreSQL database in the instance
const database = new gcp.sql.Database("lamar-database", {
  name: "lamar",
  instance: postgresInstance.name,
});

// Step 4: Create a database user
const dbUser = new gcp.sql.User("postgres-user", {
  name: "postgres",
  instance: postgresInstance.name,
  password,
});
