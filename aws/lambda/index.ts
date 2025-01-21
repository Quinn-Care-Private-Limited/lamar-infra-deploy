import { lambdaFunction as FfmpegLambda } from "./ffmpeg";
import { lambdaFunction as FilesLambda } from "./files";
import { lambdaFunction as StorageLambda } from "./storage";

export const ffmpegWorkerArn = FfmpegLambda.arn;
export const filesWorkerArn = FilesLambda.arn;
export const storageWorkerArn = StorageLambda.arn;
