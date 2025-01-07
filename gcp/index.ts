import * as pulumi from "@pulumi/pulumi";
import { vpcNetwork, subnetwork1, subnetwork2, subnetwork3 } from "./vpc";
import { filestore } from "./filestore";
import { ffmpegWorker } from "./cloudrun/ffmpeg-worker";
import { storageWorker } from "./cloudrun/storage-worker";
import { instance as dbInstance } from "./db";
import { instance } from "./compute";

export const vpcNetworkId = vpcNetwork.id;
export const subnetworks = pulumi
  .all([subnetwork1.id, subnetwork2.id, subnetwork3.id])
  .apply(([a, b, c]) => [a, b, c]);
export const filestoreId = filestore.id;
export const ffmpegWorkerId = ffmpegWorker.id;
export const storageWorkerId = storageWorker.id;
export const postgresInstanceId = dbInstance.id;
export const instanceId = instance.id;
