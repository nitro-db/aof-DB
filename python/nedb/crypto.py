"""
nedb.crypto — AES-256-GCM encryption at rest with a double-envelope key structure.

Architecture
────────────
External TMK (Table Master Key)  ← provided by operator (env / arg / key file)
         ↓  AES-256-GCM wrap
       DEK  (Data Encryption Key)  ← random, per database, stored in key.enc
         ↓  AES-256-GCM encrypt
       Data  (AOF lines, snapshot.json, blob chunks)

Key rotation: supply a new TMK and call rewrap_dek(). The DEK (and therefore
all data) stays untouched — only key.enc is rewritten.

Toggle: if no TMK is configured (no arg, no env, no key file), every function
is a zero-overhead pass-through. Existing unencrypted databases work unchanged.

TMK sources (priority order):
  1. NEDB(path, tmk=<bytes>)              — programmatic
  2. NEDB_TMK=<64-char hex>               — environment variable
  3. NEDB_TMK_FILE=/path/to/keyfile       — raw bytes from a file
  4. (none)                               — encryption disabled

HKDF normalization: the TMK may be any length ≥ 16 bytes; it is always
stretched / compressed to exactly 32 bytes via HKDF-SHA256 before use, so
passphrases and key files of any size are accepted safely.
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
from typing import Optional

# Optional dependency — graceful error if not installed.
try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    from cryptography.hazmat.primitives.kdf.hkdf import HKDF
    from cryptography.hazmat.primitives import hashes
    _HAVE_CRYPTO = True
except ImportError:
    _HAVE_CRYPTO = False

KEY_LEN   = 32    # 256-bit
NONCE_LEN = 12    # 96-bit GCM nonce (standard recommendation)

# Additional Authenticated Data tags — bind ciphertext to its purpose.
_AAD_DEK  = b"NEDB-DEK-v1"
_AAD_DATA = b"NEDB-data-v1"


def _require_crypto() -> None:
    if not _HAVE_CRYPTO:
        raise ImportError(
            "pip install cryptography  is required for NEDB encryption at rest."
        )


def derive_key(material: bytes) -> bytes:
    """Normalise any-length key material to exactly 32 bytes via HKDF-SHA256."""
    _require_crypto()
    h = HKDF(algorithm=hashes.SHA256(), length=KEY_LEN,
              salt=b"NEDB-hkdf-v1", info=b"nedb-key")
    return h.derive(material)


def resolve_tmk(tmk_arg: Optional[bytes] = None) -> Optional[bytes]:
    """
    Return the 32-byte TMK to use, or None if encryption is not configured.
    Priority: explicit arg > NEDB_TMK env (hex) > NEDB_TMK_FILE env.
    """
    material: Optional[bytes] = None
    if tmk_arg is not None:
        material = tmk_arg
    elif os.environ.get("NEDB_TMK"):
        try:
            material = bytes.fromhex(os.environ["NEDB_TMK"])
        except ValueError as e:
            raise ValueError(f"NEDB_TMK is not valid hex: {e}") from e
    elif os.environ.get("NEDB_TMK_FILE"):
        with open(os.environ["NEDB_TMK_FILE"], "rb") as fh:
            material = fh.read().strip()
    if material is None:
        return None
    return derive_key(material)


# ── Low-level primitives ─────────────────────────────────────────────────────

def encrypt_bytes(plaintext: bytes, dek: bytes) -> bytes:
    """AES-256-GCM encrypt. Returns nonce‖ciphertext‖tag (12 + len + 16 bytes)."""
    _require_crypto()
    nonce = os.urandom(NONCE_LEN)
    ct = AESGCM(dek).encrypt(nonce, plaintext, _AAD_DATA)
    return nonce + ct


def decrypt_bytes(data: bytes, dek: bytes) -> bytes:
    """AES-256-GCM decrypt. Raises cryptography.exceptions.InvalidTag on tampering."""
    _require_crypto()
    nonce, ct = data[:NONCE_LEN], data[NONCE_LEN:]
    return AESGCM(dek).decrypt(nonce, ct, _AAD_DATA)


# ── DEK management ───────────────────────────────────────────────────────────

KEY_ENC_FILE = "key.enc"


def _key_enc_path(data_dir: str) -> str:
    return os.path.join(data_dir, KEY_ENC_FILE)


def generate_dek() -> bytes:
    """Generate a fresh random 256-bit Data Encryption Key."""
    return os.urandom(KEY_LEN)


def wrap_dek(dek: bytes, tmk: bytes) -> dict:
    """Encrypt the DEK with the TMK → a JSON-serialisable dict."""
    _require_crypto()
    nonce = os.urandom(NONCE_LEN)
    ct = AESGCM(tmk).encrypt(nonce, dek, _AAD_DEK)
    return {"v": 1, "alg": "AES-256-GCM", "n": nonce.hex(), "ct": ct.hex()}


def unwrap_dek(wrapped: dict, tmk: bytes) -> bytes:
    """Decrypt the DEK using the TMK. Raises InvalidTag if the TMK is wrong."""
    _require_crypto()
    nonce = bytes.fromhex(wrapped["n"])
    ct    = bytes.fromhex(wrapped["ct"])
    return AESGCM(tmk).decrypt(nonce, ct, _AAD_DEK)


def load_or_create_dek(data_dir: str, tmk: bytes) -> bytes:
    """
    Load and unwrap the DEK from key.enc, or generate a new one if the file
    does not yet exist (new encrypted database).
    """
    path = _key_enc_path(data_dir)
    if os.path.exists(path):
        with open(path, encoding="utf-8") as fh:
            wrapped = json.load(fh)
        return unwrap_dek(wrapped, tmk)
    # New database — generate a fresh DEK and persist it wrapped.
    dek = generate_dek()
    _save_wrapped_dek(data_dir, dek, tmk)
    return dek


def _save_wrapped_dek(data_dir: str, dek: bytes, tmk: bytes) -> None:
    path = _key_enc_path(data_dir)
    tmp  = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(wrap_dek(dek, tmk), fh)
        fh.flush()
        os.fsync(fh.fileno())
    os.replace(tmp, path)


def rewrap_dek(data_dir: str, old_tmk: bytes, new_tmk: bytes) -> None:
    """
    Key rotation: re-wrap the DEK under a new TMK without touching any data.
    After this call, the database will only open with new_tmk.
    """
    dek = load_or_create_dek(data_dir, old_tmk)
    _save_wrapped_dek(data_dir, dek, new_tmk)


# ── AOF line helpers ─────────────────────────────────────────────────────────

def aof_encode(op_json: str, dek: Optional[bytes]) -> str:
    """
    Encode one AOF line. If dek is set, the JSON is encrypted and the line
    is a compact JSON envelope. Otherwise the original JSON is returned as-is.
    """
    if dek is None:
        return op_json
    ct = encrypt_bytes(op_json.encode(), dek)
    return json.dumps({"enc": 1, "ct": base64.b64encode(ct).decode()},
                      separators=(",", ":"))


def aof_decode(line: str, dek: Optional[bytes]) -> str:
    """
    Decode one AOF line. Handles both encrypted and plain lines transparently
    so a database can be opened with or without a DEK.
    """
    stripped = line.strip()
    if not stripped:
        return stripped
    if dek is not None:
        try:
            env = json.loads(stripped)
            if isinstance(env, dict) and env.get("enc") == 1:
                ct = base64.b64decode(env["ct"])
                return decrypt_bytes(ct, dek).decode()
        except Exception:
            pass  # fall through to plain read (migration from unencrypted)
    return stripped


# ── Snapshot helpers ─────────────────────────────────────────────────────────

def snapshot_encode(content: bytes, dek: Optional[bytes]) -> bytes:
    """Encrypt the entire snapshot.json content if a DEK is set."""
    if dek is None:
        return content
    ct = encrypt_bytes(content, dek)
    envelope = json.dumps({"enc": 1, "ct": base64.b64encode(ct).decode()},
                          separators=(",", ":"))
    return envelope.encode()


def snapshot_decode(raw: bytes, dek: Optional[bytes]) -> bytes:
    """Decrypt snapshot.json content if it's encrypted."""
    if dek is None:
        return raw
    try:
        env = json.loads(raw)
        if isinstance(env, dict) and env.get("enc") == 1:
            ct = base64.b64decode(env["ct"])
            return decrypt_bytes(ct, dek)
    except Exception:
        pass
    return raw  # plain (migration from unencrypted)


# ── BlobStore chunk helpers ──────────────────────────────────────────────────

def chunk_encode(compressed_bytes: bytes, dek: Optional[bytes]) -> bytes:
    """Encrypt a compressed chunk before storing it. Toggle-able."""
    return encrypt_bytes(compressed_bytes, dek) if dek is not None else compressed_bytes


def chunk_decode(stored_bytes: bytes, dek: Optional[bytes]) -> bytes:
    """Decrypt a stored chunk. Toggle-able."""
    return decrypt_bytes(stored_bytes, dek) if dek is not None else stored_bytes
