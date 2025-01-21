import { dbUrl } from "./db";
import { elasticIp } from "./ec2";

export const serverIp = elasticIp.publicIp;
export const databaseUrl = dbUrl;
