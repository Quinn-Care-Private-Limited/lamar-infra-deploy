import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

// Step 1: Define configuration values
const gcpConfig = new pulumi.Config("gcp");
const region = gcpConfig.require("region");

const lamarConfig = new pulumi.Config("lamar");
const password = lamarConfig.require("db_password");

// Step 2: Create a Google Cloud SQL PostgreSQL instance
export const instance = new gcp.sql.DatabaseInstance("lamar-db-instance", {
  name: "lamar-db-instance",
  databaseVersion: "POSTGRES_16", // Choose the desired PostgreSQL version
  region: region,
  instanceType: "CLOUD_SQL_INSTANCE", // Create a new instance
  deletionProtection: false,
  settings: {
    edition: "ENTERPRISE",
    diskSize: 10,
    diskAutoresize: true,
    diskType: "PD_HDD",
    tier: "db-custom-2-3840",
    deletionProtectionEnabled: false,
    ipConfiguration: {
      ipv4Enabled: true, // Enable public IP access (optional)
      authorizedNetworks: [
        {
          name: "all-users",
          value: "0.0.0.0/0", // Allow access from all IPs
        },
      ],
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
  instance: instance.name,
});

// Step 4: Create a database user
const dbUser = new gcp.sql.User("postgres-user", {
  name: "postgres",
  instance: instance.name,
  password,
});

export const dbUrl = pulumi.interpolate`postgresql://${dbUser.name}:${password}@${instance.publicIpAddress}:5432/${database.name}?sslmode=verify-full&pool_timeout=0`;
