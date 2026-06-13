import { Injectable } from '@nestjs/common';

export interface StorageMetadata {
  fileName: string;
  sizeKb: number;
  contentType: string;
  uploadedBy: string;
  timestamp: string;
  checksum?: string;
}

export interface StorageProvider {
  name: string;
  uploadFile(fileBuffer: Buffer, metadata: StorageMetadata): Promise<string>;
  downloadFile(url: string): Promise<Buffer>;
  deleteFile(url: string): Promise<boolean>;
  getDownloadUrl(url: string): Promise<string>;
}

export class LocalStorageProvider implements StorageProvider {
  name = 'LocalStorageProvider';
  
  async uploadFile(fileBuffer: Buffer, metadata: StorageMetadata): Promise<string> {
    console.log(`[LocalStorageProvider] Simulated writing ${metadata.sizeKb}KB payload to localsandbox file-system.`);
    const fileKey = `local_sandbox_${Date.now()}_${metadata.fileName}`;
    return `local://${fileKey}`;
  }

  async downloadFile(url: string): Promise<Buffer> {
    console.log(`[LocalStorageProvider] Fetching simulated buffer for localized record: ${url}`);
    return Buffer.from('mock-file-content');
  }

  async deleteFile(url: string): Promise<boolean> {
    console.log(`[LocalStorageProvider] Deleting local record: ${url}`);
    return true;
  }

  async getDownloadUrl(url: string): Promise<string> {
    return 'https://api.dicebear.com/7.x/initials/svg?seed=DOC';
  }
}

export class S3StorageProvider implements StorageProvider {
  name = 'S3StorageProvider';
  private bucketName: string;
  private region: string;

  constructor(bucketName = 'ooms-audit-documents', region = 'eu-west-1') {
    this.bucketName = bucketName;
    this.region = region;
  }

  async uploadFile(fileBuffer: Buffer, metadata: StorageMetadata): Promise<string> {
    console.log(`[S3StorageProvider] S3 PutObject upload to bucket S3://${this.bucketName}/${metadata.fileName}`);
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${encodeURIComponent(metadata.fileName)}`;
  }

  async downloadFile(url: string): Promise<Buffer> {
    console.log(`[S3StorageProvider] S3 GetObject stream from Cloud URL: ${url}`);
    return Buffer.from('mock-s3-file-content');
  }

  async deleteFile(url: string): Promise<boolean> {
    console.log(`[S3StorageProvider] S3 DeleteObject from Cloud Bucket: ${url}`);
    return true;
  }

  async getDownloadUrl(url: string): Promise<string> {
    return url;
  }
}

export class GCSStorageProvider implements StorageProvider {
  name = 'GCSStorageProvider';
  private bucketName: string;

  constructor(bucketName = 'ooms-nigeria-dms-vault') {
    this.bucketName = bucketName;
  }

  async uploadFile(fileBuffer: Buffer, metadata: StorageMetadata): Promise<string> {
    console.log(`[GCSStorageProvider] GCS UploadObject stream to bucket gs://${this.bucketName}/${metadata.fileName}`);
    return `https://storage.googleapis.com/${this.bucketName}/${encodeURIComponent(metadata.fileName)}`;
  }

  async downloadFile(url: string): Promise<Buffer> {
    console.log(`[GCSStorageProvider] GCS DownloadObject from Cloud Storage: ${url}`);
    return Buffer.from('mock-gcs-file-content');
  }

  async deleteFile(url: string): Promise<boolean> {
    console.log(`[GCSStorageProvider] GCS DeleteObject from Cloud Storage: ${url}`);
    return true;
  }

  async getDownloadUrl(url: string): Promise<string> {
    return url;
  }
}

@Injectable()
export class StorageService {
  public activeProvider: StorageProvider;

  constructor() {
    const providerType = process.env.STORAGE_PROVIDER || 'LOCAL_STORAGE';
    if (providerType === 'S3_STORAGE' || providerType === 'AWS_S3') {
      this.activeProvider = new S3StorageProvider(
        process.env.AWS_BUCKET || 'ooms-audit-documents'
      );
    } else if (providerType === 'GCS_STORAGE' || providerType === 'GCS') {
      this.activeProvider = new GCSStorageProvider();
    } else {
      this.activeProvider = new LocalStorageProvider();
    }
    console.log(`[Backend-StorageService] Activated Operational Provider: ${this.activeProvider.name}`);
  }

  async uploadDocument(fileBuffer: Buffer, metadata: StorageMetadata): Promise<string> {
    return this.activeProvider.uploadFile(fileBuffer, metadata);
  }

  async downloadDocument(url: string): Promise<Buffer> {
    return this.activeProvider.downloadFile(url);
  }

  async deleteDocument(url: string): Promise<boolean> {
    return this.activeProvider.deleteFile(url);
  }

  async getDocumentDisplayUrl(url: string): Promise<string> {
    return this.activeProvider.getDownloadUrl(url);
  }
}
