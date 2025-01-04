import * as gcp from "@pulumi/gcp";
import { vpcNetwork } from "../vpc";

export const filestore = new gcp.filestore.Instance("ffmpeg-worker-fs", {
  tier: "BASIC_HDD",
  location: "us-central1-a",
  networks: [
    {
      network: vpcNetwork.id,
      modes: ["MODE_IPV4"],
    },
  ],
  fileShares: {
    capacityGb: 1024,
    name: "share1",
  },
});
