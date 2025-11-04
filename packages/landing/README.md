# Grip Landing Page

Landing page for showcasing the Grip app with download links.

## Usage

### Standalone
```bash
python packages/landing/server.py
```

The landing page will be available at `http://localhost:8080`

### With main.py
The landing page is automatically started when you run:
```bash
python main.py
```

## Configuration

Edit `downloads.json` to add download links for Android and iOS builds:
```json
{
  "android": "https://your-download-link.com/app.apk",
  "ios": "https://apps.apple.com/app/grip/id123456",
  "web": "http://localhost:19006"
}
```

After building the app, update the download links in `downloads.json`.

## Troubleshooting

### Landing page not opening
1. Check if the server is running: `python packages/landing/server.py`
2. Check if port 8080 is available (another app might be using it)
3. Try opening manually: `http://localhost:8080`
4. Check the console output for error messages

### Port already in use
If port 8080 is already in use, the server will automatically try port 8081.
