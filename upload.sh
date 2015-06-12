/usr/local/bin/youtube-upload \
  --client-secrets=/Users/lmccart/Documents/eo/api_credentials.json \
  --privacy=public \
  --description="testing" \
  --title="eo testing" \
  --title-template="{title} ({n}/{total})" \
  --location="latitude=40.687730, longitude=-73.979779, altitude=0" \
  $1