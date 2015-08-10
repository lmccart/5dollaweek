ffmpeg -i $1 -c:v libx264 -strict experimental -preset fast $1.1920p60.mov
ffmpeg -i $1 -c:v libx264 -r 30 -strict experimental -preset fast $1.1920p30.mov
ffmpeg -i $1 -c:v libx264 -filter:v scale=2160:-1 -strict experimental -preset fast $1.2160p60.mov