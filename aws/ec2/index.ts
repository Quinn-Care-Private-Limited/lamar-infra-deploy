import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { publicSubnet1, vpc } from "../vpc";
// import {dbUrl} from "../db"

const lamarConfig = new pulumi.Config("lamar");
const dockerImage = lamarConfig.require("docker_image");
const videoCsmServerUrl = lamarConfig.get("video_csm_server_url") || "";
const videoCsmServerSecret = lamarConfig.get("video_csm_server_secret") || "";
const maxAssetProcesses = lamarConfig.getNumber("max_asset_processes") || 1000;
const maxVideoProcesses = lamarConfig.getNumber("max_video_processes") || 1000;
const lamarPublicKey = lamarConfig.require("lamar_public_key");

// Define Docker image and environment variables
const startUpScript = pulumi.interpolate`#!/bin/bash
yum update -y
amazon-linux-extras install docker
service docker start
usermod -a -G docker ec2-user
systemctl enable docker

docker run -d -p 80:80 \
-e NODE_ENV=production \
-e PORT=80 \
${dockerImage}`;

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
export const ec2Instance = new aws.ec2.Instance("ec2-instance", {
  instanceType: "t2.micro", // Adjust as needed
  ami: "ami-06cb4d48053a9622f",
  keyName: "ec2-maintainer",
  subnetId: publicSubnet1.id,
  vpcSecurityGroupIds: [ec2SecurityGroup.id],
  associatePublicIpAddress: true, // Ensure the instance has a public IP
  userData: startUpScript,
  tags: {
    Name: "lamar-ec2-instance",
  },
});
