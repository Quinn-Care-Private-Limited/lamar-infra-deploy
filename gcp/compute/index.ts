import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";
import { dbUrl } from "../db";
import { ffmpegWorkerServiceUrl } from "../cloudrun/ffmpeg-worker";
import { storageWorkerServiceUrl } from "../cloudrun/storage-worker";
import { filesWorkerServiceUrl } from "../cloudrun/files-worker";
import { subnetwork1, vpcNetwork } from "../vpc";

const gcpConfig = new pulumi.Config("gcp");
const region = gcpConfig.require("region");

const lamarConfig = new pulumi.Config("lamar");
const dockerImage = lamarConfig.require("core_docker_image");
const videoCsmServerUrl = lamarConfig.get("video_csm_server_url") || "";
const maxAssetProcesses = lamarConfig.getNumber("max_asset_processes") || 1000;
const maxVideoProcesses = lamarConfig.getNumber("max_video_processes") || 1000;
const lamarPublicKey = lamarConfig.require("lamar_public_key");

// Reserve a static IP address
export const staticIp = new gcp.compute.Address("lamar-instance-static-ip", {
  region, // Ensure the region matches the instance
});

const containerDeclaration = pulumi.interpolate`spec:
  containers:
  - name: lamar-core
    image: ${dockerImage}
    env:
    - name: HOST
      value: http://${staticIp.address}
    - name: CLOUD_TYPE
      value: gcp
    - name: DATABASE_URL
      value: ${dbUrl}
    - name: VIDEO_CSM_SERVER_URL
      value: ${videoCsmServerUrl}
    - name: MAX_ASSET_PROCESSES
      value: ${maxAssetProcesses}
    - name: MAX_VIDEO_PROCESSES
      value: ${maxVideoProcesses}
    - name: LAMAR_PUBLIC_KEY
      value: ${lamarPublicKey}  
    - name: FFMPEG_WORKER_URL
      value: ${ffmpegWorkerServiceUrl}
    - name: STORAGE_WORKER_URL
      value: ${storageWorkerServiceUrl}
    - name: FILES_WORKER_URL
      value: ${filesWorkerServiceUrl}
    securityContext:
      privileged: true
    stdin: false
    tty: false
  restartPolicy: Always`;

const _default = new gcp.serviceaccount.Account("lamar-core-sa", {
  accountId: "lamar-core-sa",
  displayName: "Custom SA for Lamar Core Instance",
});

// Define the Google Compute Engine instance
export const instance = new gcp.compute.Instance(
  "lamar-core-instance",
  {
    name: "larmar-core",
    zone: `${region}-a`,
    machineType: "e2-small",
    bootDisk: {
      autoDelete: true,
      deviceName: "lamar-core",
      initializeParams: {
        image: "projects/cos-cloud/global/images/cos-stable-117-18613-75-89",
        size: 10,
        type: "pd-balanced",
      },
      mode: "READ_WRITE",
    },
    canIpForward: false,
    deletionProtection: false,
    enableDisplay: false,
    labels: {
      "container-vm": "cos-stable-117-18613-75-89",
      "goog-ec-src": "vm_add-tf",
    },
    metadata: {
      "gce-container-declaration": containerDeclaration,
    },
    networkInterfaces: [
      {
        accessConfigs: [
          {
            networkTier: "PREMIUM",
            natIp: staticIp.address,
          },
        ],
        queueCount: 0,
        stackType: "IPV4_ONLY",
        network: vpcNetwork.id,
        subnetwork: subnetwork1.id,
      },
    ],
    serviceAccount: {
      email: _default.email,
      scopes: ["cloud-platform"],
    },
    tags: ["http-server"],
  },
  {
    replaceOnChanges: ["metadata"],
    deleteBeforeReplace: true,
  }
);
