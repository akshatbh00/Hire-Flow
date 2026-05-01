"""
s3.py — production storage backend (AWS S3)
Falls back to local.py automatically if STORAGE_BACKEND != "s3"
"""
import boto3
import tempfile
from pathlib import Path
from config import settings

if settings.STORAGE_BACKEND == "s3":
    _s3 = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )
else:
    _s3 = None


def upload_file(file_key: str, content: bytes) -> str:
    if settings.STORAGE_BACKEND == "s3":
        _s3.put_object(
            Bucket=settings.AWS_S3_BUCKET,
            Key=file_key,
            Body=content,
        )
        return f"s3://{settings.AWS_S3_BUCKET}/{file_key}"
    else:
        # fallback to local in dev
        from storage.local import upload_file as local_upload
        return local_upload(file_key, content)


def download_file(file_key: str) -> str:
    """Downloads to a temp file and returns the local path."""
    if settings.STORAGE_BACKEND == "s3":
        suffix = Path(file_key).suffix
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        _s3.download_fileobj(settings.AWS_S3_BUCKET, file_key, tmp)
        tmp.close()
        return tmp.name
    else:
        from storage.local import download_file as local_download
        return local_download(file_key)


def delete_file(file_key: str) -> None:
    if settings.STORAGE_BACKEND == "s3":
        _s3.delete_object(Bucket=settings.AWS_S3_BUCKET, Key=file_key)
    else:
        from storage.local import delete_file as local_delete
        local_delete(file_key)


def get_presigned_url(file_key: str, expires: int = 3600) -> str:
    """Generate a short-lived signed URL for direct browser download."""
    if settings.STORAGE_BACKEND != "s3":
        return f"/api/v1/resume/file/{file_key}"   # local dev fallback
    return _s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.AWS_S3_BUCKET, "Key": file_key},
        ExpiresIn=expires,
    )