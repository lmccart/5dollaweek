echo 'The script starts now.'
ffmpeg -i /Users/lmccart/Documents/eo/recordings2/$1 -c:v libx264 -r 30 -strict experimental -preset fast /Users/lmccart/Documents/eo/recordings2/compressed/$1.1920p30.mov
python /Users/lmccart/Documents/eo/upload.py -f /Users/lmccart/Documents/eo/recordings2/compressed/$1.1920p30.mov -n $2
echo 'The script ends now.'