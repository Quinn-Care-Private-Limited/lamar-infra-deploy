import * as gcp from "@pulumi/gcp";
import { vpcNetwork } from "../vpc";

import * as pulumi from "@pulumi/pulumi";

// Step 1: Define configuration values
const config = new pulumi.Config();
const region = config.require("region");

export const filestore = new gcp.filestore.Instance("ffmpeg-worker-fs", {
  tier: "BASIC_HDD",
  location: `${region}-a`,
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
