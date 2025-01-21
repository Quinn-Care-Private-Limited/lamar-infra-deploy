import * as aws from "@pulumi/aws";
import { publicSubnet1, publicSubnet2, vpc } from "../vpc";

// Create a security group for EFS
const efsSecurityGroup = new aws.ec2.SecurityGroup("efs-security-group", {
  vpcId: vpc.id,
  description: "Allow NFS traffic for EFS",
  ingress: [
    {
      protocol: "tcp",
      fromPort: 2049, // NFS port
      toPort: 2049,
      cidrBlocks: ["0.0.0.0/0"], // Adjust this as per your security needs
    },
  ],
  egress: [
    {
      protocol: "-1",
      fromPort: 0,
      toPort: 0,
      cidrBlocks: ["0.0.0.0/0"],
    },
  ],
  tags: {
    Name: "lamar-efs-security-group",
  },
});

// Create an EFS file system
export const efs = new aws.efs.FileSystem("efs", {
  performanceMode: "generalPurpose", // Choose 'maxIO' for high throughput
  encrypted: true,
  tags: {
    Name: "lamar-efs",
  },
});

// Create mount targets in each subnet
export const mountTarget1 = new aws.efs.MountTarget("mount-target-1", {
  fileSystemId: efs.id,
  subnetId: publicSubnet1.id,
  securityGroups: [efsSecurityGroup.id],
});

export const mountTarget2 = new aws.efs.MountTarget("mount-target-2", {
  fileSystemId: efs.id,
  subnetId: publicSubnet2.id,
  securityGroups: [efsSecurityGroup.id],
});

// EFS access point used by lambda file system
export const lambdaAccessPoint = new aws.efs.AccessPoint(
  "lambda-access-point",
  {
    fileSystemId: efs.id,
    rootDirectory: {
      path: "/efs",
      creationInfo: {
        ownerGid: 1000,
        ownerUid: 1000,
        permissions: "777",
      },
    },
    posixUser: {
      gid: 1000,
      uid: 1000,
    },
  }
);
