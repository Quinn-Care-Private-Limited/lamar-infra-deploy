import * as pulumi from "@pulumi/pulumi";

const lamarConfig = new pulumi.Config("lamar");
const clientId = lamarConfig.require("client_id");
const clientSecret = lamarConfig.require("client_secret");
const gcpCredentials = lamarConfig.require("gcp_credentials");

export const env = [
  { name: "NODE_ENV", value: "production" },
  { name: "FS_PATH", value: "/mnt/efs" },
  { name: "CLOUD_STORAGE", value: "GCS" },
  { name: "CLIENT_ID", value: clientId },
  { name: "CLIENT_SECRET", value: clientSecret },
  { name: "GCP_CREDENTIALS", value: gcpCredentials },
];
