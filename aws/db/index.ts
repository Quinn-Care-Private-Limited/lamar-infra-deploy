import * as aws from "@pulumi/aws";
import { publicSubnet1, publicSubnet2, vpc } from "../vpc";
import * as pulumi from "@pulumi/pulumi";

const lamarConfig = new pulumi.Config("lamar");
const password = lamarConfig.require("db_password");

// Create a DB subnet group
const dbSubnetGroup = new aws.rds.SubnetGroup("db-subnet-group", {
  subnetIds: [publicSubnet1.id, publicSubnet2.id],
  tags: {
    Name: "lamar-db-subnet-group",
  },
});

// Create a security group for RDS
const rdsSecurityGroup = new aws.ec2.SecurityGroup("rds-security-group", {
  vpcId: vpc.id,
  description: "Allow PostgreSQL access",
  ingress: [
    {
      protocol: "tcp",
      fromPort: 5432, // PostgreSQL default port
      toPort: 5432,
      cidrBlocks: ["0.0.0.0/0"], // Adjust to restrict access
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
    Name: "lamar-rds-security-group",
  },
});

// Create an RDS PostgreSQL instance
export const rdsInstance = new aws.rds.Instance("lamar-db", {
  allocatedStorage: 10, // Storage in GB
  engine: "postgres",
  engineVersion: "16.3", // Specify desired PostgreSQL version
  instanceClass: "db.t3.micro", // Change based on performance requirements
  dbName: "lamar", // Database name
  username: "postgres", // Master username
  password, // Master password (store securely, e.g., using Pulumi Config or AWS Secrets Manager)
  dbSubnetGroupName: dbSubnetGroup.name,
  vpcSecurityGroupIds: [rdsSecurityGroup.id],
  multiAz: false, // Set to true for Multi-AZ deployments
  storageType: "gp2",
  publiclyAccessible: false, // Set to true if access is needed from the public internet
  skipFinalSnapshot: true, // Set to false for production to retain final snapshots
  tags: {
    Name: "lamar-db",
  },
});

export const dbUrl = pulumi.interpolate`postgresql://${rdsInstance.username}:${rdsInstance.password}@${rdsInstance.endpoint}/${rdsInstance.dbName}?sslmode=require&pool_timeout=0`;
