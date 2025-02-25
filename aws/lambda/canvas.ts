import * as aws from "@pulumi/aws";
import { vpc, publicSubnet2 } from "../vpc";
import { efs, lambdaAccessPoint, mountTarget2 } from "../efs";
import * as pulumi from "@pulumi/pulumi";
import * as fs from "fs";
import * as childProcess from "child_process";

const lambdaName = "canvas";
const lamarConfig = new pulumi.Config("lamar");
const layerArn = lamarConfig.require("layer_arn");
const workerVersion = lamarConfig.require("worker_version");

const lambdaZipUrl = `https://storage.googleapis.com/lamar-infra-assets/worker-lambda/${workerVersion}/${lambdaName}.zip`;
const lambdaZipPath = `assets/${lambdaName}.zip`;

// Download the file if it doesn't exist
if (!fs.existsSync(lambdaZipPath)) {
  console.log(`Downloading zip file from ${lambdaZipUrl}...`);
  childProcess.execSync(`curl -o ${lambdaZipPath} ${lambdaZipUrl}`);
}

const lambdaSecurityGroup = new aws.ec2.SecurityGroup(
  `${lambdaName}-lambda-security-group`,
  {
    vpcId: vpc.id,
    description: "Allow Lambda and EFS access",
    ingress: [
      {
        protocol: "tcp",
        fromPort: 2049,
        toPort: 2049,
        cidrBlocks: [vpc.cidrBlock], // Allow NFS access within the VPC
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
    tags: { Name: `${lambdaName}-lambda-security-group` },
  }
);

const lambdaRole = new aws.iam.Role(`${lambdaName}-lambda-role`, {
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    Service: "lambda.amazonaws.com",
  }),
});

new aws.iam.RolePolicyAttachment(`${lambdaName}-lambda-role-policy`, {
  role: lambdaRole.name,
  policyArn: aws.iam.ManagedPolicies.AWSLambdaVPCAccessExecutionRole,
});

// Create the Lambda function
export const lambdaFunction = new aws.lambda.Function(
  `${lambdaName}-lambda-function`,
  {
    runtime: "nodejs22.x", // Adjust for your runtime
    code: new pulumi.asset.FileArchive(lambdaZipPath),
    role: lambdaRole.arn,
    handler: `${lambdaName}.handler`,
    layers: [layerArn],
    memorySize: 10240,
    timeout: 900,
    fileSystemConfig: {
      arn: lambdaAccessPoint.arn,
      localMountPath: "/mnt/efs",
    },
    vpcConfig: {
      subnetIds: [publicSubnet2.id],
      securityGroupIds: [lambdaSecurityGroup.id],
    },
    environment: {
      variables: {
        NODE_ENV: "production",
        FS_PATH: "/mnt/efs",
      },
    },
    tags: { Name: `${lambdaName}-function-with-efs-and-layer` },
  },
  {
    dependsOn: [mountTarget2],
  }
);
