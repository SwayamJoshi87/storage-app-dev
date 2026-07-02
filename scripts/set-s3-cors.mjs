import { config } from 'dotenv'
import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3'

config({ path: '.env.local' })

const bucket = process.env.AWS_S3_BUCKET
if (!bucket) {
  console.error('AWS_S3_BUCKET is not set in .env.local')
  process.exit(1)
}

const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-1', followRegionRedirects: true })

await s3.send(new PutBucketCorsCommand({
  Bucket: bucket,
  CORSConfiguration: {
    CORSRules: [
      {
        // Allow direct browser PUT uploads via pre-signed URLs.
        // x-amz-storage-class is required because it is a signed header in the presigned URL.
        AllowedHeaders: ['content-type', 'x-amz-storage-class'],
        AllowedMethods: ['PUT'],
        AllowedOrigins: ['*'],
        MaxAgeSeconds: 3000,
      },
      {
        // Allow GET for future signed download URLs.
        AllowedHeaders: [],
        AllowedMethods: ['GET'],
        AllowedOrigins: ['*'],
        MaxAgeSeconds: 3000,
      },
    ],
  },
}))

console.log(`✓ CORS configured on bucket: ${bucket}`)
