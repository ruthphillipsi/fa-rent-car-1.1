import { S3Client } from '@aws-sdk/client-s3';
import type { Environment } from '../config/environment';

export function createStorageClient(
  environment: Pick<Environment, 'S3_ENDPOINT' | 'S3_REGION' | 'S3_ACCESS_KEY' | 'S3_SECRET_KEY'>,
  { presigning = false }: { presigning?: boolean } = {},
) {
  return new S3Client({
    endpoint: environment.S3_ENDPOINT,
    region: environment.S3_REGION,
    forcePathStyle: true,
    // A body-less presign must not bind the eventual upload to an empty-body checksum.
    requestChecksumCalculation: presigning ? 'WHEN_REQUIRED' : 'WHEN_SUPPORTED',
    credentials: {
      accessKeyId: environment.S3_ACCESS_KEY,
      secretAccessKey: environment.S3_SECRET_KEY,
    },
    maxAttempts: 2,
    requestHandler: { connectionTimeout: 3000, requestTimeout: 5000 },
  });
}
