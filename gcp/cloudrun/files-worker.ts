import * as gcp from "@pulumi/gcp";
import { subnetwork2, vpcNetwork } from "../vpc";
import { filestore } from "../filestore";
import { env, region, workerDockerImage } from "./env";

// Create the Cloud Run service
export const filesWorker = new gcp.cloudrunv2.Service("files-worker", {
  location: region,
  ingress: "INGRESS_TRAFFIC_ALL",
  deletionProtection: false,
  template: {
    annotations: {
      "run.googleapis.com/cpu-throttling": "true",
      "run.googleapis.com/startup-cpu-boost": "true",
    },
    timeout: "100s",
    maxInstanceRequestConcurrency: 1,
    scaling: {
      minInstanceCount: 0,
      maxInstanceCount: 200,
    },
    executionEnvironment: "EXECUTION_ENVIRONMENT_GEN2",
    vpcAccess: {
      egress: "PRIVATE_RANGES_ONLY",
      networkInterfaces: [
        {
          network: vpcNetwork.name,
          subnetwork: subnetwork2.name,
        },
      ],
    },
    containers: [
      {
        name: "files-worker-1",
        image: workerDockerImage,
        ports: {
          name: "http1",
          containerPort: 8080,
        },

        envs: env,
        resources: {
          limits: {
            cpu: "0.5",
            memory: "1Gi",
          },
        },
        volumeMounts: [
          {
            name: "share1",
            mountPath: "/mnt/efs",
          },
        ],
        livenessProbe: {
          timeoutSeconds: 1,
          periodSeconds: 10,
          failureThreshold: 3,
          httpGet: {
            path: "/health",
            port: 8080,
          },
        },
        startupProbe: {
          timeoutSeconds: 240,
          periodSeconds: 240,
          failureThreshold: 1,
          tcpSocket: {
            port: 8080,
          },
        },
      },
    ],
    volumes: [
      {
        name: "share1",
        nfs: {
          server: filestore.networks[0].ipAddresses[0],
          path: "share1",
        },
      },
    ],
  },
});

const noauth = gcp.organizations.getIAMPolicy({
  bindings: [
    {
      role: "roles/run.invoker",
      members: ["allUsers"],
    },
  ],
});
const noauthIamPolicy = new gcp.cloudrun.IamPolicy("files-worker-noauth", {
  location: filesWorker.location,
  project: filesWorker.project,
  service: filesWorker.name,
  policyData: noauth.then((noauth) => noauth.policyData),
});

export const filesWorkerServiceUrl = filesWorker.urls.apply((urls) => urls[0]);
