import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

// Step 1: Define configuration values
const config = new pulumi.Config();
const region = config.require("region");

const lamarConfig = new pulumi.Config("lamar");
const sourceRanges = lamarConfig.require("source_ranges");

// Step 1: Create a VPC Network
export const vpcNetwork = new gcp.compute.Network("lamar-vpc", {
  autoCreateSubnetworks: false, // Disable auto subnet creation
});

// Step 2: Create a Subnetwork
export const subnetwork1 = new gcp.compute.Subnetwork("lamar-subnet-1", {
  ipCidrRange: "10.0.0.0/24",
  region,
  network: vpcNetwork.id,
});

export const subnetwork2 = new gcp.compute.Subnetwork("lamar-subnet-2", {
  ipCidrRange: "10.1.0.0/16",
  region,
  network: vpcNetwork.id,
});

export const firewallAllowHttp = new gcp.compute.Firewall(
  "lamar-firewall-allow-http",
  {
    name: "lamar-allow-http",
    network: vpcNetwork.id,
    allows: [
      {
        protocol: "tcp",
        ports: ["80"],
      },
    ],
    sourceRanges: [sourceRanges],
    targetTags: ["http-server"],
  }
);

export const firewallAllowInternal = new gcp.compute.Firewall(
  "lamar-firewall-allow-internal",
  {
    name: "lamar-allow-internal",
    network: vpcNetwork.id,
    allows: [
      {
        protocol: "tcp",
        ports: ["0-65535"],
      },
      {
        protocol: "udp",
        ports: ["0-65535"],
      },
      {
        protocol: "icmp",
      },
    ],
    sourceRanges: ["10.0.0.0/8"],
  }
);

export const firewallAllowSSH = new gcp.compute.Firewall(
  "lamar-firewall-allow-ssh",
  {
    name: "lamar-allow-ssh",
    network: vpcNetwork.id,
    allows: [
      {
        protocol: "tcp",
        ports: ["22"],
      },
    ],
    sourceRanges: ["0.0.0.0/0"],
  }
);
