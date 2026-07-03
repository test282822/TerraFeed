# terrafeed backend: image ingest endpoint

The node POSTs raw JPEGs (no multipart) with metadata in headers. Add this
route to the terrafeed backend.

## Contract

```
POST /api/v1/nodes/{node_id}/images
Authorization: Bearer <token>
Content-Type: image/jpeg
X-TFN-Seq: <uint32, node-local sequence>
X-TFN-Captured-At: <uint32, unix seconds or uptime — check TIME_VALID in flags>
X-TFN-Flags: <hex byte, same bitfield as the packet>
Body: raw JPEG bytes
```

Respond `200` or `201` on success — anything else stops the node's upload
session (it resumes next WiFi window). Idempotency: `(node_id, seq)` is a
natural unique key; a node re-uploads a seq only if the success response was
lost, so upsert on that pair.

## FastAPI sketch

```python
from fastapi import APIRouter, Request, Header, HTTPException

router = APIRouter()

@router.post("/api/v1/nodes/{node_id}/images", status_code=201)
async def ingest(node_id: str, request: Request,
                 authorization: str = Header(...),
                 x_tfn_seq: int = Header(...),
                 x_tfn_captured_at: int = Header(...),
                 x_tfn_flags: str = Header("00")):
    if authorization != f"Bearer {settings.tfn_token}":
        raise HTTPException(401)
    body = await request.body()
    if not body.startswith(b"\xff\xd8"):        # JPEG SOI sanity check
        raise HTTPException(400, "not a JPEG")
    # upsert on (node_id, x_tfn_seq); store body to disk/S3; row in DB
    return {"stored": True, "seq": x_tfn_seq}
```

Notes:
- Enforce a max body size (UXGA q12 JPEGs are typically 100–300 KB; cap at ~1 MB).
- Per-node bearer tokens are the eventual right answer; single shared token is
  fine for v1 with few nodes.
- Timestamps without TIME_VALID are uptime seconds — store raw and reconcile
  server-side using receive time minus uptime as a rough capture estimate.
