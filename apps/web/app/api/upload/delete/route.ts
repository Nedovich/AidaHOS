import { NextRequest, NextResponse } from 'next/server';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSession } from '@/lib/auth';

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT!,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.MINIO_BUCKET ?? 'aidahos';
const PUBLIC_URL = process.env.MINIO_PUBLIC_URL ?? process.env.MINIO_ENDPOINT ?? '';

/** Extract the S3 key from a full public URL, e.g.
 *  https://storage.kreatinmedya.com/aidahos/events/esken-bodrum/123.jpg
 *  → events/esken-bodrum/123.jpg
 */
function urlToKey(url: string): string | null {
  const prefix = `${PUBLIC_URL}/${BUCKET}/`;
  if (!url.startsWith(prefix)) return null;
  return url.slice(prefix.length);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role === 'customer') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { url } = (await req.json()) as { url?: string };
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

  const key = urlToKey(url);
  if (!key) return NextResponse.json({ error: 'url does not belong to this bucket' }, { status: 400 });

  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  return NextResponse.json({ ok: true });
}
