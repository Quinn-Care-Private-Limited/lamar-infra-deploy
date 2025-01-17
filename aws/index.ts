import * as pulumi from "@pulumi/pulumi";
// import { vpc, publicSubnet1, publicSubnet2 } from "./vpc";
// import { efs } from "./efs";
// import { rdsInstance, dbUrl } from "./db";
// import { ffmpegLambdaFunction } from "./lambda/ffmpeg";
import { ec2Instance, elasticIp } from "./ec2";

// export const vpcNetworkId = vpc.id;
// export const subnetworks = pulumi
//   .all([publicSubnet1.id, publicSubnet2.id])
//   .apply(([a, b]) => [a, b]);
// export const efsId = efs.id;
// export const dbInstanceId = rdsInstance.id;
// export const dbInstanceUrl = dbUrl;
// export const ffmpegLambdaFunctionArn = ffmpegLambdaFunction.arn;
export const ec2Ip = elasticIp.publicIp;
