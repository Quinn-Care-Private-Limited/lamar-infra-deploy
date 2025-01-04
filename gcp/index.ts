import { vpcNetwork, subnetwork1, subnetwork2 } from "./vpc";
import { filestore } from "./filestore";
import { ffmpegWorker } from "./cloudrun/ffmpeg-worker";

export const vpcNetworkId = vpcNetwork.id;
export const subnetwork1Id = subnetwork1.id;
export const subnetwork2Id = subnetwork2.id;
export const filestoreId = filestore.id;
export const ffmpegWorkerId = ffmpegWorker.id;
