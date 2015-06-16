
$("document").ready(function(){
    

  navigator.getUserMedia  = navigator.getUserMedia ||
                            navigator.webkitGetUserMedia ||
                            navigator.mozGetUserMedia ||
                            navigator.msGetUserMedia;

  var video = document.createElement('video');
  var video_container = document.createElement('div');
  $(video_container).append(video);
  $('body').append(video_container);

  $(video).css('width', '288px');
  $(video).css('height', '216px');
  $(video).css('margin-top', '-23px');
  $(video).css('margin-left', '-69px');
  
  $(video_container).css('position', 'fixed');
  $(video_container).css('bottom', '20px');
  $(video_container).css('left', '20px');
  $(video_container).css('width', '150px');
  $(video_container).css('height', '150px');
  $(video_container).css('border', '3px solid rgb(0, 216, 255)');
  $(video_container).css('overflow', 'hidden');
  $(video_container).css('z-index', '4');

  MediaStreamTrack.getSources(function(sourceInfos) {
    var audioSource = null;
    var videoSource = null;

    for (var i = 0; i != sourceInfos.length; ++i) {
      var sourceInfo = sourceInfos[i];
      if (sourceInfo.kind === 'video') {
        console.log(sourceInfo.id, sourceInfo.label || 'camera');
        if (sourceInfo.label.indexOf('Webcam') !== -1) {
          videoSource = sourceInfo.id;
        }
      }
    }

    navigator.getUserMedia({audio: false, video: {
        optional: [{sourceId: videoSource}]
      }}, function(stream) {
      video.src = window.URL.createObjectURL(stream);
      video.play();
    }, function(error) {
      console.log(error);
    });


  });
});
