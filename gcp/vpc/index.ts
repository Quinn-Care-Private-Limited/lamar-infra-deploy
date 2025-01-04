import * as gcp from "@pulumi/gcp";

// Step 1: Create a VPC Network
export const vpcNetwork = new gcp.compute.Network("lamar-vpc", {
  autoCreateSubnetworks: false, // Disable auto subnet creation
});

// Step 2: Create a Subnetwork
export const subnetwork1 = new gcp.compute.Subnetwork("lamar-subnet-1", {
  ipCidrRange: "10.0.0.0/24",
  region: "us-central1",
  network: vpcNetwork.id,
});

export const subnetwork2 = new gcp.compute.Subnetwork("lamar-subnet-2", {
  ipCidrRange: "10.1.0.0/16",
  region: "us-central1",
  network: vpcNetwork.id,
});
