import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { publicSubnet1, vpc } from "../vpc";
import { dbUrl } from "../db";
import { ffmpegWorkerArn, filesWorkerArn, storageWorkerArn } from "../lambda";

const config = new pulumi.Config();
const region = config.require("region");

const lamarConfig = new pulumi.Config("lamar");
const sourceRanges = lamarConfig.require("source_ranges");
const videoCsmServerUrl = lamarConfig.get("video_csm_server_url") || "";
const maxAssetProcesses = lamarConfig.getNumber("max_asset_processes") || 1000;
const maxVideoProcesses = lamarConfig.getNumber("max_video_processes") || 1000;
const lamarPublicKey = lamarConfig.require("lamar_public_key");
const lamarCoreVersion = lamarConfig.require("lamar_core_version");
const sshKeyName = lamarConfig.require("ssh_key_name");
const awsAccessKeyId = lamarConfig.require("aws_access_key_id");
const awsSecretKey = lamarConfig.require("aws_secret_access_key");

// Allocate an Elastic IP
export const elasticIp = new aws.ec2.Eip("ec2-elastic-ip", {
  domain: "vpc",
  tags: {
    Name: "lamar-ec2-elastic-ip",
  },
});

// Define Docker image and environment variables
const startUpScript = pulumi.interpolate`#!/bin/bash
curl -O https://storage.googleapis.com/lamar-infra-assets/lamar-core/${lamarCoreVersion}/lamar-core
curl -O https://storage.googleapis.com/lamar-infra-assets/lamar-core/prisma/schema.prisma
curl -O https://storage.googleapis.com/lamar-infra-assets/lamar-core/prisma-binaries/libquery_engine-rhel-openssl-3.0.x.so.node
chmod +x lamar-core

screen -dmS lamar-job bash -c \
"HOST='http://${elasticIp.publicIp}' \
CLOUD_TYPE=aws \
VIDEO_CSM_SERVER_URL='${videoCsmServerUrl}' \
MAX_ASSET_PROCESSES=${maxAssetProcesses} \
MAX_VIDEO_PROCESSES=${maxVideoProcesses} \
FFMPEG_WORKER_URL='${ffmpegWorkerArn}' \
FILES_WORKER_URL='${filesWorkerArn}' \
STORAGE_WORKER_URL='${storageWorkerArn}' \
LAMAR_PUBLIC_KEY=${lamarPublicKey} \
AWS_ACCESS_KEY_ID=${awsAccessKeyId} \
AWS_SECRET_ACCESS_KEY=${awsSecretKey} \
AWS_REGION=${region} \
DATABASE_URL='${dbUrl}' \ 
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
      cidrBlocks: [sourceRanges], // Allow HTTP traffic from anywhere
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
