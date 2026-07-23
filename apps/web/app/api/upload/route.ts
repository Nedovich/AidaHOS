import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSession } from '@/lib/auth';

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT!,
  region: 'us-east-1', // MinIO ignores region but SDK requires one
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true, // required for MinIO
});

const BUCKET = process.env.MINIO_BUCKET ?? 'aidahos';
const PUBLIC_URL = process.env.MINIO_PUBLIC_URL ?? process.env.MINIO_ENDPOINT ?? '';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role === 'customer') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get('file');
  const folder = (form.get('folder') as string | null) ?? 'uploads';

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP and GIF allowed' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 8 MB)' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const bytes = await file.arrayBuffer();

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: Buffer.from(bytes),
        ContentType: file.type,
      }),
    );
  } catch (err) {
    console.error('[upload] S3 PutObject failed:', err);
    return NextResponse.json({ error: 'Upload to storage failed' }, { status: 500 });
  }

  const url = `${PUBLIC_URL}/${BUCKET}/${key}`;
  return NextResponse.json({ url });
}
