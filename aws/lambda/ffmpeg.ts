import * as aws from "@pulumi/aws";
import { vpc, publicSubnet2 } from "../vpc";
import { lambdaAccessPoint, mountTarget2 } from "../efs";
import * as pulumi from "@pulumi/pulumi";

const lamarConfig = new pulumi.Config("lamar");
const layerArn = lamarConfig.require("layer_arn");

const lambdaSecurityGroup = new aws.ec2.SecurityGroup(
  "ffmpeg-lambda-security-group",
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
    tags: { Name: "ffmpeg-lambda-security-group" },
  }
);

const lambdaRole = new aws.iam.Role("ffmpeg-lambda-role", {
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    Service: "lambda.amazonaws.com",
  }),
});

new aws.iam.RolePolicyAttachment("ffmpeg-lambda-role-policy", {
  role: lambdaRole.name,
  policyArn: aws.iam.ManagedPolicies.AWSLambdaVPCAccessExecutionRole,
});

// Create the Lambda function
export const ffmpegLambdaFunction = new aws.lambda.Function(
  "ffmpeg-lambda-function",
  {
    runtime: "nodejs22.x", // Adjust for your runtime
    s3Bucket: "lamar-infra-assets",
    s3Key: "ffmpeg.zip",
    role: lambdaRole.arn,
    handler: "ffmpeg.handler",
    layers: [layerArn],
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
    tags: { Name: "lambda-function-with-efs-and-layer" },
  },
  {
    dependsOn: [mountTarget2],
  }
);
