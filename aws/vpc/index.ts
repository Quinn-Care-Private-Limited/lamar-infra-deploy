import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();
const region = config.require("region");

// Create a new VPC
export const vpc = new aws.ec2.Vpc("vpc", {
  cidrBlock: "10.0.0.0/16",
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: {
    Name: "lamar-vpc",
  },
});

// Create public subnets
export const publicSubnet1 = new aws.ec2.Subnet("public-subnet-1", {
  vpcId: vpc.id,
  cidrBlock: "10.0.1.0/24",
  mapPublicIpOnLaunch: true,
  availabilityZone: `${region}a`, // Adjust as needed
  tags: {
    Name: "public-subnet-1",
  },
});

export const publicSubnet2 = new aws.ec2.Subnet("public-subnet-2", {
  vpcId: vpc.id,
  cidrBlock: "10.1.0.0/16",
  mapPublicIpOnLaunch: true,
  availabilityZone: `${region}b`, // Adjust as needed
  tags: {
    Name: "public-subnet-2",
  },
});

// Create an internet gateway
const internetGateway = new aws.ec2.InternetGateway("internet-gateway", {
  vpcId: vpc.id,
  tags: {
    Name: "internet-gateway",
  },
});

// Create a route table for public subnets
const routeTable = new aws.ec2.RouteTable("public-route-table", {
  vpcId: vpc.id,
  routes: [
    {
      cidrBlock: "0.0.0.0/0",
      gatewayId: internetGateway.id,
    },
  ],
  tags: {
    Name: "public-route-table",
  },
});

// Associate the route table with public subnets
new aws.ec2.RouteTableAssociation("public-route-association-1", {
  subnetId: publicSubnet1.id,
  routeTableId: routeTable.id,
});

new aws.ec2.RouteTableAssociation("public-route-association-2", {
  subnetId: publicSubnet2.id,
  routeTableId: routeTable.id,
});
