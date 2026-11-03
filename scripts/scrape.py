"""
Mannco.store Scraper

Purpose:
Collect item listings from the Mannco.store API with robust pagination,
deduplication, and atomic file output.

Configuration (.env):
  Required: BASE_URL, API_TOKEN, TARGET_ITEM (numeric item ID)
  Optional: PAGE_SIZE=100, MAX_PAGES=1000, REQUEST_TIMEOUT=15,
            PAGE_DELAY=1.0, PAGINATION_STYLE=page, API_VERSION=v1,
            USER_AGENT=ManncoScraper/1.0 (+https://your-site),
            TF2_QUALITY, TF2_SPELL

Run:
  python scrape.py
  python scrape.py --quality Strange --spell "Spectral Spectrum"

Output Contract:
  data/items.json — JSON array of records, each with a stable 'id' field.
  data/meta.json  — {fetched_at, record_count, source_url, api_version,
                      pagination_style, script_version, target_item, filters_applied}
"""

import os
import sys
import json
import time
import logging
import hashlib
import argparse
from pathlib import Path
from datetime import datetime, timezone
from dataclasses import dataclass
from typing import List, Dict, Any, Optional

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from dotenv import load_dotenv

DEFAULT_USER_AGENT = "ManncoScraper/1.0 (+https://github.com/yourname/yourrepo)"


@dataclass
class Config:
    api_token: str
    base_url: str
    target_item: str
    game: str
    user_agent: str
    page_size: int = 100
    max_pages: int = 1000
    request_timeout: int = 15
    page_delay: float = 1.0
    pagination_style: str = "page"
    api_version: str = "v1"
    tf2_quality: Optional[str] = None
    tf2_spell: Optional[str] = None
    wear: Optional[str] = None
    item_class: Optional[str] = None


def load_config(args=None) -> Config:
    load_dotenv()
    api_token = os.getenv("API_TOKEN")
    base_url = os.getenv("BASE_URL")
    
    # 440=TF2, 730=CS2, 570=Dota 2, 252490=Rust, 753=Steam
    game = getattr(args, 'game', None) or os.getenv("GAME_ID") or "440"
    target_item = getattr(args, 'item', None) or os.getenv("TARGET_ITEM") or game

    missing = [n for n, v in [("API_TOKEN", api_token),
                              ("BASE_URL", base_url)] if not v]
    if missing:
        print(f"Error: missing env vars: {', '.join(missing)}")
        sys.exit(1)

    # CLI args override .env
    tf2_quality = getattr(args, 'quality', None) or os.getenv("TF2_QUALITY")
    tf2_spell = getattr(args, 'spell', None) or os.getenv("TF2_SPELL")
    wear = getattr(args, 'wear', None) or os.getenv("TF2_WEAR")
    item_class = getattr(args, 'item_class', None) or os.getenv("TF2_CLASS")

    cfg = Config(
        api_token=api_token,
        base_url=base_url.rstrip("/"),
        target_item=target_item,
        game=str(game),
        user_agent=os.getenv("USER_AGENT", DEFAULT_USER_AGENT),
        page_size=int(os.getenv("PAGE_SIZE", "100")),
        max_pages=int(os.getenv("MAX_PAGES", "1000")),
        request_timeout=int(os.getenv("REQUEST_TIMEOUT", "15")),
        page_delay=float(os.getenv("PAGE_DELAY", "1.0")),
        pagination_style=os.getenv("PAGINATION_STYLE", "page").lower(),
        api_version=os.getenv("API_VERSION", "v1"),
        tf2_quality=tf2_quality,
        tf2_spell=tf2_spell,
        wear=wear,
        item_class=item_class,
    )
    if cfg.page_size <= 0 or cfg.max_pages <= 0:
        print("Error: PAGE_SIZE and MAX_PAGES must be positive.")
        sys.exit(1)
    if cfg.pagination_style not in ("page", "offset", "cursor"):
        print(f"Error: unsupported PAGINATION_STYLE '{cfg.pagination_style}'.")
        sys.exit(1)
    return cfg


def get_auth_token(base_url: str, api_token: str) -> str:
    cache_path = Path("data/.jwt_cache.json")
    if cache_path.exists():
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if data.get("jwt") and data.get("exp", 0) > time.time() + 60:
                    return data["jwt"]
        except Exception:
            pass

    if api_token.count(".") == 2:
        return api_token

    try:
        r = requests.post(f"{base_url}/user/login", json={"apiKey": api_token}, timeout=10)
        data = r.json()
        if data.get("success") and "content" in data and isinstance(data["content"], dict):
            jwt = data["content"].get("jwt")
            if jwt:
                cache_path.parent.mkdir(exist_ok=True)
                with open(cache_path, "w", encoding="utf-8") as f:
                    json.dump({"jwt": jwt, "exp": time.time() + 86400 * 7}, f)
                return jwt
    except Exception as e:
        logging.warning(f"Login failed: {e}")

    return api_token


def build_session(config: Config) -> requests.Session:
    token = get_auth_token(config.base_url, config.api_token)
    session = requests.Session()
    session.headers.update({
        "Authorization": f"Bearer {token}",
        "User-Agent": config.user_agent,
        "Accept": "application/json",
    })
    retry = Retry(
        total=5, backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    return session


def _check_response(resp: requests.Response, url: str) -> None:
    """Raise with a helpful message on 403 (Cloudflare), then standard HTTPError."""
    if resp.status_code == 403:
        raise requests.HTTPError(
            f"403 Forbidden from {url}. Likely causes: (1) Cloudflare bot protection "
            f"— set a realistic USER_AGENT with a real contact; (2) invalid/expired "
            f"API_TOKEN; (3) IP blocked. Body: {resp.text[:200]}",
            response=resp,
        )
    resp.raise_for_status()


def _extract_records(payload: Any) -> List[Dict]:
    if isinstance(payload, list):
        return [r for r in payload if isinstance(r, dict)]
    if isinstance(payload, dict):
        content = payload.get("content")
        if isinstance(content, list):
            return [r for r in content if isinstance(r, dict)]
        if isinstance(content, dict):
            info = content.get("informations") or content.get("data") or []
            if isinstance(info, list):
                return [r for r in info if isinstance(r, dict)]
        data = payload.get("data")
        if isinstance(data, list):
            return [r for r in data if isinstance(r, dict)]
    return []


def fetch_page_page_style(session, config, state) -> List[Dict]:
    url = f"{config.base_url}/item/listing/{config.target_item}"
    params: Dict[str, Any] = {"page": state["page"], "count": config.page_size}
    if config.game:
        params["game"] = config.game
    if config.tf2_quality:
        params["tf2Quality"] = config.tf2_quality
    if config.tf2_spell:
        params["tf2Spell"] = config.tf2_spell
    if config.wear:
        params["wear"] = config.wear
    if config.item_class:
        params["class"] = config.item_class
    
    t0 = time.time()
    r = session.get(url, params=params, timeout=config.request_timeout)
    _check_response(r, url)
    records = _extract_records(r.json())
    logging.info(f"page={state['page']} -> {len(records)} records in {time.time()-t0:.2f}s")
    return records


def fetch_page_offset_style(session, config, state) -> List[Dict]:
    url = f"{config.base_url}/item/listing/{config.target_item}"
    params: Dict[str, Any] = {"offset": state["offset"], "count": config.page_size}
    if config.game:
        params["game"] = config.game
    if config.tf2_quality:
        params["tf2Quality"] = config.tf2_quality
    if config.tf2_spell:
        params["tf2Spell"] = config.tf2_spell
    if config.wear:
        params["wear"] = config.wear
    if config.item_class:
        params["class"] = config.item_class
    
    r = session.get(url, params=params, timeout=config.request_timeout)
    _check_response(r, url)
    return _extract_records(r.json())


def fetch_page_cursor_style(session, config, state) -> List[Dict]:
    url = f"{config.base_url}/item/listing/{config.target_item}"
    params: Dict[str, Any] = {"cursor": state["cursor"] or "", "count": config.page_size}
    if config.game:
        params["game"] = config.game
    if config.tf2_quality:
        params["tf2Quality"] = config.tf2_quality
    if config.tf2_spell:
        params["tf2Spell"] = config.tf2_spell
    if config.wear:
        params["wear"] = config.wear
    if config.item_class:
        params["class"] = config.item_class
    
def fetch_all(session, config) -> List[Dict]:
    fetchers = {
        "page": fetch_page_page_style,
        "offset": fetch_page_offset_style,
        "cursor": fetch_page_cursor_style,
    }
    fetcher = fetchers[config.pagination_style]
    state = {"page": 0, "offset": 0, "cursor": None}
    all_records: List[Dict] = []

    for _ in range(config.max_pages):
        records = fetcher(session, config, state)
        if not records:
            break
        all_records.extend(records)

        if config.pagination_style == "page":
            state["page"] += 1
        elif config.pagination_style == "offset":
            state["offset"] += len(records)
        elif config.pagination_style == "cursor":
            new_cursor = records[-1].get("next_cursor") if records else None
            if not new_cursor or new_cursor == state["cursor"]:
                break
            state["cursor"] = new_cursor

        # Mannco page response is capped at 10 items. Stop when end reached or target reached
        if len(records) < 10 or len(all_records) >= config.page_size:
            break
        time.sleep(config.page_delay)
    else:
        logging.warning(f"Reached MAX_PAGES limit ({config.max_pages})")

    return all_records


def normalize_records(records: List[Dict], session: Optional[requests.Session] = None, base_url: str = "") -> List[Dict]:
    unique: Dict[str, Dict] = {}
    details_cache: Dict[Any, Dict] = {}
    dupes = 0
    for rec in records:
        rid = rec.get("id")
        if rid is None:
            rid = hashlib.sha1(
                json.dumps(rec, sort_keys=True).encode()
            ).hexdigest()
        rec["id"] = rid

        # Enrich with item name and store URL from /item/details
        item_id = rec.get("item_id")
        if item_id and item_id not in details_cache and session and base_url:
            try:
                r = session.get(f"{base_url}/item/details/{item_id}", timeout=6)
                data = r.json()
                info = data.get("content", {}).get("informations", {})
                if isinstance(info, dict):
                    details_cache[item_id] = info
            except Exception:
                details_cache[item_id] = {}

        details = details_cache.get(item_id, {})
        base_name = details.get("name") or rec.get("name") or f"Item #{item_id or rid}"
        sheen = rec.get("sheen")
        rec["name"] = f"{base_name} ({sheen})" if sheen and sheen not in base_name else base_name
        
        slug = details.get("url") or (f"{rec.get('game', 440)}-{item_id}" if item_id else str(rid))
        rec["item_url"] = f"https://mannco.store/item/{slug}"
        if "craftable" not in rec and "craftable" in details:
            rec["craftable"] = details.get("craftable") == 1

        if rid in unique:
            dupes += 1
        unique[rid] = rec
    if dupes:
        logging.warning(f"Dropped {dupes} duplicate records.")
    return list(unique.values())


def save_output(records: List[Dict], config: Config) -> None:
    out = Path("data")
    out.mkdir(exist_ok=True)

    items_path = out / "items.json"
    meta_path = out / "meta.json"

    tmp = items_path.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)
    os.replace(tmp, items_path)

    filters_applied = {}
    if config.game:
        filters_applied["game"] = config.game
    if config.target_item and config.target_item != config.game:
        filters_applied["item"] = config.target_item
    if config.tf2_quality:
        filters_applied["quality"] = config.tf2_quality
    if config.tf2_spell:
        filters_applied["spell"] = config.tf2_spell
    if config.wear:
        filters_applied["wear"] = config.wear
    if config.item_class:
        filters_applied["class"] = config.item_class

    meta = {
        "fetched_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "record_count": len(records),
        "source_url": f"{config.base_url}/item/listing/{config.target_item}",
        "api_version": config.api_version,
        "pagination_style": config.pagination_style,
        "script_version": "1.0.2",
        "target_item": config.target_item,
        "filters_applied": filters_applied,
    }
    tmp = meta_path.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    os.replace(tmp, meta_path)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Market Scraper")
    parser.add_argument("--game", type=str, default="440", help="Game App ID (440=TF2, 730=CS2, 570=Dota 2, 252490=Rust, 753=Steam)")
    parser.add_argument("--item", type=str, help="Item ID or URL slug")
    parser.add_argument("--quality", type=str, help="Item quality (e.g., Unique, Strange, Unusual)")
    parser.add_argument("--spell", type=str, help="Item spell (e.g., Spectral Spectrum, Die Job)")
    parser.add_argument("--wear", type=str, help="Exterior wear (e.g., Factory New, Field-Tested)")
    parser.add_argument("--item-class", "--class", dest="item_class", type=str, help="Character class (e.g., Scout, Soldier)")
    return parser.parse_args()


def main() -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    try:
        args = parse_args()
        config = load_config(args)
        session = build_session(config)
        if not config.target_item.isdigit():
            try:
                r = session.get(f"{config.base_url}/item/details/{config.target_item}", timeout=config.request_timeout)
                info = r.json().get("content", {}).get("informations", {})
                resolved_id = info.get("id") if isinstance(info, dict) else None
                if resolved_id:
                    logging.info(f"Resolved slug '{config.target_item}' -> item_id={resolved_id}")
                    config.target_item = str(resolved_id)
            except Exception as e:
                logging.warning(f"Could not resolve item slug '{config.target_item}': {e}")
        logging.info(f"Scraping item_id={config.target_item} style={config.pagination_style}")
        if config.tf2_quality or config.tf2_spell:
            logging.info(f"Filters: quality={config.tf2_quality}, spell={config.tf2_spell}")
        raw = fetch_all(session, config)
        clean = normalize_records(raw, session=session, base_url=config.base_url)
        save_output(clean, config)
        if not clean:
            logging.warning("0 records — verify BASE_URL, API_TOKEN, TARGET_ITEM.")
        logging.info(f"Saved {len(clean)} records to data/")
        return 0
    except requests.exceptions.RequestException as e:
        logging.error(f"HTTP error: {e}")
        return 1
    except Exception as e:
        logging.error(f"Unexpected error: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())
