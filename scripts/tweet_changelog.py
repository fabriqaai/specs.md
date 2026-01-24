#!/usr/bin/env python3
"""
Tweet new changelog entries for specsmd.

Reads CHANGELOG.md, detects new version entries, and posts them to Twitter.
Tracks published versions in .changelog-published to avoid duplicates.
"""

import os
import re
import sys
from pathlib import Path
from datetime import datetime

try:
    import tweepy
except ImportError:
    print("tweepy not installed. Run: pip install tweepy")
    sys.exit(1)


def text_to_unicode_bold(text):
    """Convert text to Unicode bold characters."""
    bold_map = {}
    for i, char in enumerate('ABCDEFGHIJKLMNOPQRSTUVWXYZ'):
        bold_map[char] = chr(0x1D5D4 + i)
    for i, char in enumerate('abcdefghijklmnopqrstuvwxyz'):
        bold_map[char] = chr(0x1D5EE + i)
    for i, char in enumerate('0123456789'):
        bold_map[char] = chr(0x1D7EC + i)
    return ''.join(bold_map.get(c, c) for c in text)


def parse_changelog(changelog_path):
    """
    Parse CHANGELOG.md and extract the latest version entry.

    Returns:
        tuple: (version, date, highlights) or (None, None, None) if not found
    """
    with open(changelog_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Match version headers like: ## [0.1.11] - 2026-01-24
    version_pattern = r'^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})'

    matches = list(re.finditer(version_pattern, content, re.MULTILINE))

    if not matches:
        print("No version entries found in CHANGELOG.md")
        return None, None, None

    # Get the first (latest) version
    latest_match = matches[0]
    version = latest_match.group(1)
    date = latest_match.group(2)

    # Extract content between this version and the next (or end of relevant content)
    start_pos = latest_match.end()

    if len(matches) > 1:
        end_pos = matches[1].start()
    else:
        # Find the --- separator or end of file
        separator = content.find('\n---\n', start_pos)
        end_pos = separator if separator != -1 else len(content)

    version_content = content[start_pos:end_pos].strip()

    # Extract highlights (bullet points from Added, Changed, Fixed sections)
    highlights = []

    for line in version_content.split('\n'):
        line = line.strip()
        if line.startswith('- '):
            item = line[2:].strip()
            # Clean up the item
            if item and len(item) < 100:
                highlights.append(item)

    return version, date, highlights[:5]  # Max 5 highlights


def get_published_version(marker_path):
    """Read the last published version from marker file."""
    if not marker_path.exists():
        return None

    with open(marker_path, 'r') as f:
        for line in f:
            if line.startswith('version:'):
                return line.split(':', 1)[1].strip()
    return None


def save_published_version(marker_path, version, tweet_id, tweet_url):
    """Save the published version to marker file."""
    with open(marker_path, 'w') as f:
        f.write(f"version: {version}\n")
        f.write(f"published_at: {datetime.utcnow().isoformat()}Z\n")
        f.write(f"tweet_id: {tweet_id}\n")
        f.write(f"tweet_url: {tweet_url}\n")


def format_tweet(version, highlights):
    """Format the tweet text."""
    header = f"🚀 {text_to_unicode_bold('specsmd')} v{version} is out!"

    # Format highlights
    if highlights:
        # Take first 3 highlights that fit
        formatted = []
        for h in highlights[:3]:
            # Shorten if needed
            if len(h) > 60:
                h = h[:57] + "..."
            formatted.append(f"• {h}")
        highlights_text = '\n'.join(formatted)
    else:
        highlights_text = ""

    url = f"https://github.com/fabriqaai/specs.md/releases/tag/v{version}"

    # Build tweet
    if highlights_text:
        tweet = f"{header}\n\n{highlights_text}\n\n👉 {url}"
    else:
        tweet = f"{header}\n\n👉 {url}"

    # Ensure it fits in 280 chars
    if len(tweet) > 280:
        # Reduce highlights
        available = 280 - len(header) - len(f"\n\n👉 {url}") - 5
        if available > 20:
            tweet = f"{header}\n\n{highlights_text[:available]}...\n\n👉 {url}"
        else:
            tweet = f"{header}\n\n👉 {url}"

    return tweet


def post_to_twitter(tweet_text):
    """Post tweet using tweepy. Returns (tweet_id, tweet_url) or (None, None)."""
    api_key = os.environ.get('TWITTER_API_KEY')
    api_secret = os.environ.get('TWITTER_API_SECRET')
    access_token = os.environ.get('TWITTER_ACCESS_TOKEN')
    access_token_secret = os.environ.get('TWITTER_ACCESS_TOKEN_SECRET')

    if not all([api_key, api_secret, access_token, access_token_secret]):
        print("⚠️  Twitter credentials not set, skipping tweet")
        print("   Required secrets: TWITTER_API_KEY, TWITTER_API_SECRET,")
        print("   TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET")
        return None, None

    try:
        client = tweepy.Client(
            consumer_key=api_key,
            consumer_secret=api_secret,
            access_token=access_token,
            access_token_secret=access_token_secret
        )
        print("✓ Twitter client initialized")
    except Exception as e:
        print(f"✗ Failed to initialize Twitter: {e}")
        return None, None

    try:
        response = client.create_tweet(text=tweet_text)
        tweet_id = response.data['id']
        tweet_url = f"https://twitter.com/i/web/status/{tweet_id}"

        print(f"✓ Tweet posted successfully!")
        print(f"  Tweet ID: {tweet_id}")
        print(f"  URL: {tweet_url}")

        return tweet_id, tweet_url

    except tweepy.TweepyException as e:
        print(f"✗ Twitter API error: {e}")
        return None, None


def main():
    """Main function."""
    # Paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    changelog_path = project_root / 'CHANGELOG.md'
    marker_path = script_dir / '.changelog-published'

    print("=" * 50)
    print("specsmd Changelog Twitter Publisher")
    print("=" * 50)

    # Check changelog exists
    if not changelog_path.exists():
        print(f"✗ CHANGELOG.md not found at {changelog_path}")
        sys.exit(1)

    # Parse changelog
    version, date, highlights = parse_changelog(changelog_path)

    if not version:
        print("✗ Could not parse version from CHANGELOG.md")
        sys.exit(0)

    print(f"\n📋 Latest version: {version} ({date})")
    print(f"   Highlights: {len(highlights)} items")
    for h in highlights:
        print(f"   • {h[:60]}{'...' if len(h) > 60 else ''}")

    # Check if already published
    published_version = get_published_version(marker_path)

    if published_version == version:
        print(f"\n⏭️  Version {version} already tweeted, skipping")
        sys.exit(0)

    if published_version:
        print(f"\n📢 New version detected! {published_version} → {version}")
    else:
        print(f"\n📢 First time publishing, version {version}")

    # Format tweet
    tweet = format_tweet(version, highlights)

    print(f"\n📝 Tweet preview ({len(tweet)} chars):")
    print("-" * 40)
    print(tweet)
    print("-" * 40)

    # Post to Twitter
    tweet_id, tweet_url = post_to_twitter(tweet)

    if tweet_id:
        # Save marker
        save_published_version(marker_path, version, tweet_id, tweet_url)
        print(f"\n✓ Marked version {version} as published")
    else:
        print("\n⚠️  Tweet not posted, marker not updated")

    print("\n" + "=" * 50)


if __name__ == "__main__":
    main()
