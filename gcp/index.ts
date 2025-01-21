import { dbUrl } from "./db";
import { staticIp } from "./compute";

export const serverIp = staticIp.address;
export const databaseUrl = dbUrl;
