import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { publicSubnet1, vpc } from "../vpc";
// import {dbUrl} from "../db"

const lamarConfig = new pulumi.Config("lamar");
const videoCsmServerUrl = lamarConfig.get("video_csm_server_url") || "";
const videoCsmServerSecret = lamarConfig.get("video_csm_server_secret") || "";
const maxAssetProcesses = lamarConfig.getNumber("max_asset_processes") || 1000;
const maxVideoProcesses = lamarConfig.getNumber("max_video_processes") || 1000;
const lamarPublicKey = lamarConfig.require("lamar_public_key");
const sshKeyName = lamarConfig.require("ssh_key_name");

// Allocate an Elastic IP
export const elasticIp = new aws.ec2.Eip("ec2-elastic-ip", {
  domain: "vpc",
  tags: {
    Name: "lamar-ec2-elastic-ip",
  },
});

// Define Docker image and environment variables
const startUpScript = pulumi.interpolate`#!/bin/bash
curl -O https://storage.googleapis.com/lamar-infra-assets/lamar-core/0.0.1/lamar-core
curl -O https://storage.googleapis.com/lamar-infra-assets/lamar-core/prisma/schema.prisma
curl -O https://storage.googleapis.com/lamar-infra-assets/lamar-core/prisma-binaries/libquery_engine-rhel-openssl-3.0.x.so.node
chmod +x lamar-core

screen -dmS lamar-job bash -c \
"export \
LAMAR_PUBLIC_KEY=${lamarPublicKey} \
HOST=http://${elasticIp.publicIp} \
VIDEO_CSM_SERVER_URL=${videoCsmServerUrl} \
VIDEO_CSM_SERVER_SECRET=${videoCsmServerSecret} \
MAX_ASSET_PROCESSES=${maxAssetProcesses} \
MAX_VIDEO_PROCESSES=${maxVideoProcesses} \
DATABASE_URL='postgresql://postgres:R52j3xT7wu2H2cPrDX7CqnVZsV7ekJdiUq@35.223.213.37:5432/lamar?schema=public&sslmode=verify-full&pool_timeout=0'; \ 
./lamar-core"
`;

// Create a security group for the EC2 instance
const ec2SecurityGroup = new aws.ec2.SecurityGroup("ec2-security-group", {
  vpcId: vpc.id,
  description: "Allow HTTP and SSH access",
  ingress: [
    {
      protocol: "tcp",
      fromPort: 22, // SSH
      toPort: 22,
      cidrBlocks: ["0.0.0.0/0"], // Allow SSH access from anywhere
    },
    {
      protocol: "tcp",
      fromPort: 80, // HTTP
      toPort: 80,
      cidrBlocks: ["0.0.0.0/0"], // Allow HTTP traffic from anywhere
    },
  ],
  egress: [
    {
      protocol: "-1",
      fromPort: 0,
      toPort: 0,
      cidrBlocks: ["0.0.0.0/0"], // Allow all outbound traffic
    },
  ],
  tags: { Name: "lamar-ec2-security-group" },
});

// Create the EC2 instance
export const ec2Instance = new aws.ec2.Instance(
  "ec2-instance",
  {
    instanceType: "t2.micro",
    ami: "ami-06cb4d48053a9622f",
    keyName: sshKeyName,
    subnetId: publicSubnet1.id,
    vpcSecurityGroupIds: [ec2SecurityGroup.id],
    associatePublicIpAddress: true,
    userData: startUpScript,
    tags: {
      Name: "lamar-ec2-instance",
    },
  },
  {
    replaceOnChanges: ["userData"],
    deleteBeforeReplace: true,
  }
);

// Associate the Elastic IP with the EC2 instance
const eipAssociation = new aws.ec2.EipAssociation("eip-association", {
  instanceId: ec2Instance.id,
  allocationId: elasticIp.id,
});
