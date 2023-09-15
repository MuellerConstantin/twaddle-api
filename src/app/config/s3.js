import {S3Client} from '@aws-sdk/client-s3';
import env from '../config/env';

const s3 = new S3Client({
  region: env.s3.region,
  credentials: {
    accessKeyId: env.s3.accessKeyId,
    secretAccessKey: env.s3.secretAccessKey,
  },
  endpoint: env.s3.uri,
  forcePathStyle: true,
});

export default s3;
export * from '@aws-sdk/client-s3';
