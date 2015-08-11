ffmpeg -i $1 -c:v libx264 -r 30 -strict experimental -preset fast $1.1920p30.mov
python upload.py -f $1.1920p30.mov -n $2