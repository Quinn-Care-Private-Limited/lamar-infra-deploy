import * as pulumi from "@pulumi/pulumi";

const lamarConfig = new pulumi.Config("lamar");
const gcpCredentials = lamarConfig.require("gcp_credentials");
export const workerDockerImage = lamarConfig.require("worker_docker_image");

const gcpConfig = new pulumi.Config("gcp");
export const region = gcpConfig.require("region");

export const env = [
  { name: "NODE_ENV", value: "production" },
  { name: "FS_PATH", value: "/mnt/efs" },
  { name: "CLOUD_STORAGE_TYPE", value: "GCS" },
  { name: "GCP_CREDENTIALS", value: gcpCredentials },
];
