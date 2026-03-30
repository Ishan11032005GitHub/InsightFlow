import hashlib

def generate_file_hash(file_data: bytes) -> str:
    """Generates an MD5 hash to uniquely identify a file's contents."""
    md5_hash = hashlib.md5()
    md5_hash.update(file_data)
    return md5_hash.hexdigest()

def format_byte_size(size: int) -> str:
    """Formats bytes into human readable sizes."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size < 1024.0:
            return f"{size:.2f} {unit}"
        size /= 1024.0
    return f"{size:.2f} TB"
