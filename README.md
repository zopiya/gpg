# GPG Online - Secure Message Encryption

An ultra-secure, zero-dependency (locally), zero-threshold online GPG encryption tool. This project allows users to encrypt messages using a pre-defined GPG public key entirely within the browser.

## Features

- **Local Encryption:** All cryptographic operations are performed locally in the browser using [OpenPGP.js](https://openpgpjs.org/). Your plain text never leaves your machine.
- **Strict Security:**
    - **Subresource Integrity (SRI):** All CSS and JS files are verified with SHA256 hashes.
    - **Content Security Policy (CSP):** A robust CSP prevents XSS and unauthorized script execution.
    - **No Inline Scripts:** Zero inline event handlers to comply with strict security standards.
- **Multilingual Support:** Automatically detects browser language (supports English and Chinese).
- **Clean UI:** Modern, responsive design with dark mode support.
- **Integrity Verified:** Includes a build script to synchronize security hashes across the project.

## Project Structure

```text
.
├── index.html          # Main application entry point
├── public.asc          # Recipient's GPG public key (REPLACE THIS)
├── assets/
│   ├── css/
│   │   └── style.css   # Application styles
│   └── js/
│       ├── app.js      # Application logic & i18n
│       └── openpgp.min.js # OpenPGP.js library (v6.3.0)
├── build.py            # Integrity synchronization script
└── README.md           # Documentation
```

## How to Use

1. **Replace the Public Key:** Overwrite `public.asc` with your own GPG public key.
2. **Update Integrity Hashes:** Run `python3 build.py` to update the SRI and CSP hashes in `index.html` and `app.js`.
3. **Deploy:** Host these files on any static web server (GitHub Pages, Netlify, Vercel, etc.).

## Security Integrity Hashes

The following hashes are automatically updated by `build.py`:

<!-- HASH_START -->
| File | SHA256 Hash (Base64) |
| :--- | :--- |
| public.asc | `sha256-E/F+NeOddP9mNILlC0/AdlosHXs7DO84bJs03e61oDQ=` |
| assets/js/app.js | `sha256-5VX5IaKPiVFKtaHAPNYmySg2sxn7RRgCxf+nZusmwVI=` |
| assets/js/openpgp.min.js | `sha256-RtPltr/k8NGbRP06qCasHGcXTpWpe+CCo5ghYLbKrk4=` |
| assets/css/style.css | `sha256-OMSHi41z76pRrYFOawXtWM8ZSLM555ctMH2kxqc/VjI=` |

*Last updated: 2026-01-05 14:32:48*
<!-- HASH_END -->

## License

MIT License. Feel free to use and modify.
