import * as pulumi from "@pulumi/pulumi";
import { vpc, publicSubnet1, publicSubnet2 } from "./vpc";

export const vpcNetworkId = vpc.id;
export const subnetworks = pulumi
  .all([publicSubnet1.id, publicSubnet2.id])
  .apply(([a, b]) => [a, b]);
