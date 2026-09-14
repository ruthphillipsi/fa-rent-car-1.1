import { CreateBucketCommand, HeadBucketCommand, S3ServiceException } from '@aws-sdk/client-s3';
import { validateEnvironment } from '../config/environment';
import { createStorageClient } from './storage-client';

async function main() {
  const environment = validateEnvironment(process.env);
  const endpoint = new URL(environment.S3_ENDPOINT);
  if (
    environment.NODE_ENV === 'production' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname)
  ) {
    throw new Error('Local bucket bootstrap refuses non-local or production storage.');
  }
  const client = createStorageClient(environment);
  try {
    try {
      await client.send(new HeadBucketCommand({ Bucket: environment.S3_BUCKET }));
    } catch (error) {
      if (!(error instanceof S3ServiceException) || error.$metadata.httpStatusCode !== 404)
        throw error;
      await client.send(new CreateBucketCommand({ Bucket: environment.S3_BUCKET }));
    }
    process.stdout.write('Private local storage is ready. No public bucket policy is created.\n');
  } finally {
    client.destroy();
  }
}

main().catch(() => {
  process.stderr.write(
    'Local storage setup failed. Check the local service and private environment configuration.\n',
  );
  process.exitCode = 1;
});
