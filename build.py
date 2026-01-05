import base64
import hashlib
import os
import re
from datetime import datetime


def get_sha256_hash(file_path):
    """Calculate the SHA256 hash of a file and return it in Base64 format."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return base64.b64encode(sha256_hash.digest()).decode("utf-8")


def update_app_js(key_hash):
    """Update the publicKey hash in assets/js/app.js."""
    file_path = "assets/js/app.js"
    if not os.path.exists(file_path):
        return

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = re.sub(r'publicKey:\s*".*?"', f'publicKey: "{key_hash}"', content)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"Updated {file_path}")


def update_index_html(app_hash, lib_hash, style_hash):
    """Update SRI hashes and CSP in index.html."""
    file_path = "index.html"
    if not os.path.exists(file_path):
        return

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    content = re.sub(
        r'(href="assets/css/style.css"\s+integrity=")sha256-.*?"',
        rf'\1sha256-{style_hash}"',
        content,
    )
    content = re.sub(
        r'(src="assets/js/openpgp.min.js"\s+integrity=")sha256-.*?"',
        rf'\1sha256-{lib_hash}"',
        content,
    )
    content = re.sub(
        r'(src="assets/js/app.js"\s+integrity=")sha256-.*?"',
        rf'\1sha256-{app_hash}"',
        content,
    )

    new_csp = (
        f"default-src 'self'; "
        f"script-src 'self' 'unsafe-eval' 'sha256-{lib_hash}' 'sha256-{app_hash}'; "
        f"style-src 'self' 'unsafe-inline' 'sha256-{style_hash}'; "
        f"img-src 'self' data:; "
        f"connect-src 'self'; "
        f"worker-src 'self' blob:;"
    )

    content = re.sub(
        r'<meta http-equiv="Content-Security-Policy" content=".*?">',
        f'<meta http-equiv="Content-Security-Policy" content="{new_csp}">',
        content,
    )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Updated {file_path}")


def update_sw_js():
    """Update cache version in sw.js."""
    file_path = "sw.js"
    if not os.path.exists(file_path):
        return

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Generate a version string based on timestamp
    version = datetime.now().strftime("%Y%m%d%H%M%S")
    new_content = re.sub(
        r'const CACHE_NAME = ".*?";',
        f'const CACHE_NAME = "gpg-online-v{version}";',
        content,
    )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"Updated {file_path} with version {version}")


def update_readme(hashes):
    """Update hashes in README.md."""
    file_path = "README.md"
    if not os.path.exists(file_path):
        return

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace content between <!-- HASH_START --> and <!-- HASH_END -->
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    hash_table = "| File | SHA256 Hash (Base64) |\n| :--- | :--- |\n"
    for name, h in hashes.items():
        hash_table += f"| {name} | `sha256-{h}` |\n"
    hash_table += f"\n*Last updated: {now}*"

    pattern = r"<!-- HASH_START -->.*?<!-- HASH_END -->"
    replacement = f"<!-- HASH_START -->\n{hash_table}\n<!-- HASH_END -->"
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"Updated {file_path}")


def main():
    print("Building GPG Online...")

    hashes = {}

    if os.path.exists("public.asc"):
        hashes["public.asc"] = get_sha256_hash("public.asc")
        update_app_js(hashes["public.asc"])

    # Update Service Worker cache name to force refresh
    update_sw_js()

    hashes["assets/js/app.js"] = get_sha256_hash("assets/js/app.js")
    hashes["assets/js/openpgp.min.js"] = get_sha256_hash("assets/js/openpgp.min.js")
    hashes["assets/css/style.css"] = get_sha256_hash("assets/css/style.css")

    if os.path.exists("sw.js"):
        hashes["sw.js"] = get_sha256_hash("sw.js")

    if os.path.exists("assets/manifest.json"):
        hashes["assets/manifest.json"] = get_sha256_hash("assets/manifest.json")

    update_index_html(
        hashes["assets/js/app.js"],
        hashes["assets/js/openpgp.min.js"],
        hashes["assets/css/style.css"],
    )
    update_readme(hashes)

    print("Build successful.")


if __name__ == "__main__":
    main()
