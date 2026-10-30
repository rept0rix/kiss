#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# KISS - Automated iOS Build & App Store Connect Release Script
# ==============================================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_DIR="$DIR/ios"
BUILD_DIR="$IOS_DIR/build"
ARCHIVE_PATH="$BUILD_DIR/App.xcarchive"
EXPORT_PATH="$BUILD_DIR/output"
EXPORT_OPTIONS="$IOS_DIR/ExportOptions.plist"

cd "$DIR"

echo "=================================================="
echo "🚀 Starting iOS Release Pipeline for KISS"
echo "=================================================="

# 1. Sync Capacitor with iOS
echo "🔄 Syncing Capacitor iOS project..."
npx cap sync ios

# Clean previous build artifacts
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR" "$EXPORT_PATH"

# 2. Archive
echo "📦 Archiving App workspace (Release configuration)..."
xcodebuild \
  -workspace "$IOS_DIR/App/App.xcworkspace" \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE_PATH" \
  archive \
  -allowProvisioningUpdates

echo "✅ Archive created at: $ARCHIVE_PATH"

# 3. Export IPA
echo "📤 Exporting IPA for App Store Connect..."
xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportOptionsPlist "$EXPORT_OPTIONS" \
  -exportPath "$EXPORT_PATH" \
  -allowProvisioningUpdates

IPA_FILE="$EXPORT_PATH/App.ipa"
if [ ! -f "$IPA_FILE" ]; then
  IPA_FILE="$(find "$EXPORT_PATH" -name "*.ipa" | head -n 1)"
fi

echo "🎉 IPA successfully created at: $IPA_FILE"

# 4. Upload to App Store Connect / TestFlight if credentials provided
UPLOAD="${1:-}"
if [ "$UPLOAD" = "--upload" ] || [ -n "${APP_STORE_CONNECT_KEY_ID:-}" ]; then
  KEY_ID="${APP_STORE_CONNECT_KEY_ID:-}"
  ISSUER_ID="${APP_STORE_CONNECT_ISSUER_ID:-}"

  if [ -z "$KEY_ID" ] || [ -z "$ISSUER_ID" ]; then
    echo "⚠️  Missing APP_STORE_CONNECT_KEY_ID or APP_STORE_CONNECT_ISSUER_ID."
    echo "To upload automatically, export:"
    echo "  export APP_STORE_CONNECT_KEY_ID=\"XXXXXXXXXX\""
    echo "  export APP_STORE_CONNECT_ISSUER_ID=\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\""
    echo "And ensure AuthKey_\$APP_STORE_CONNECT_KEY_ID.p8 is in ~/.private_keys/"
    exit 1
  fi

  echo "🚀 Uploading $IPA_FILE to App Store Connect / TestFlight..."
  xcrun altool --upload-app \
    -f "$IPA_FILE" \
    -t ios \
    --apiKey "$KEY_ID" \
    --apiIssuer "$ISSUER_ID"

  echo "✅ Upload completed successfully to TestFlight!"
else
  echo ""
  echo "ℹ️  To upload this IPA to TestFlight, run:"
  echo "   bash scripts/release-ios.sh --upload"
  echo "Or use Apple Transporter app to drag and drop: $IPA_FILE"
fi
