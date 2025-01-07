import * as gcp from "@pulumi/gcp";

const _default = new gcp.serviceaccount.Account("lamar-core-sa", {
  accountId: "lamar-core-sa",
  displayName: "Custom SA for Lamar Core Instance",
});

// Define the Google Compute Engine instance
export const instance = new gcp.compute.Instance("lamar-core", {
  name: "larmar-core",
  zone: "us-central1-a",
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
    "gce-container-declaration": `spec:
  containers:
  - name: instance-20250107-062451
    image: quinninc/lamar-core:latest
    env:
    - name: NODE_ENV
      value: production
    - name: PORT
      value: '80'
    securityContext:
      privileged: true
    stdin: false
    tty: false
  restartPolicy: Always`,
  },
  networkInterfaces: [
    {
      accessConfigs: [
        {
          networkTier: "PREMIUM",
        },
      ],
      queueCount: 0,
      stackType: "IPV4_ONLY",
      subnetwork:
        "projects/lamar-445707/regions/us-central1/subnetworks/default",
    },
  ],
  serviceAccount: {
    email: _default.email,
    scopes: ["cloud-platform"],
  },
  tags: ["http-server", "https-server"],
});
