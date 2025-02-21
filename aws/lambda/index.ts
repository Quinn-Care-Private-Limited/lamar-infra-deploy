import { lambdaFunction as FfmpegLambda } from "./ffmpeg";
import { lambdaFunction as FilesLambda } from "./files";
import { lambdaFunction as StorageLambda } from "./storage";
import { lambdaFunction as CanvasLambda } from "./canvas";

export const ffmpegWorkerArn = FfmpegLambda.arn;
export const filesWorkerArn = FilesLambda.arn;
export const storageWorkerArn = StorageLambda.arn;
export const canvasWorkerArn = CanvasLambda.arn;
