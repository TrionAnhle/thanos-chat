import { Injectable } from '@nestjs/common';
import { Client as MinioClient } from 'minio';

@Injectable()
export class ImagesService {
  private readonly minio: MinioClient;
  private readonly bucket: string;
  private readonly pathPrefix: string;

  constructor() {
    const endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
    const accessKey = process.env.MINIO_ACCESS_KEY || 'admin';
    const secretKey = process.env.MINIO_SECRET_KEY || 'password!';
    this.bucket = process.env.MINIO_BUCKET || 'thanos';
    this.pathPrefix = process.env.MINIO_BUCKET_PREFIX || 'img';

    const { hostname, port, protocol } = new URL(endpoint);
    const useSSL = protocol === 'https:';

    this.minio = new MinioClient({
      endPoint: hostname,
      port: port ? Number(port) : useSSL ? 443 : 80,
      useSSL,
      accessKey,
      secretKey,
    });
  }

  async getUploadSignedUrl(filename: string) {
    const key = `${this.pathPrefix}/${Date.now()}_${filename}`;
    const expirySeconds = Number(process.env.MINIO_URL_EXPIRE_SECONDS) || 60;
    const url = await this.minio.presignedPutObject(
      this.bucket,
      key,
      expirySeconds,
    );

    return { url, key, bucket: this.bucket };
  }
}
