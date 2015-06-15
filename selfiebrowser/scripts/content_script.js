
$("document").ready(function(){
    

  navigator.getUserMedia  = navigator.getUserMedia ||
                            navigator.webkitGetUserMedia ||
                            navigator.mozGetUserMedia ||
                            navigator.msGetUserMedia;

  var video = document.createElement('video');
  var video_container = document.createElement('div');
  $(video_container).append(video);
  $('body').append(video_container);

  $(video).css('width', '240px');
  $(video).css('height', '180px');
  $(video).css('margin-top', '0px');
  $(video).css('margin-left', '-45px');
  
  $(video_container).css('position', 'fixed');
  $(video_container).css('bottom', '20px');
  $(video_container).css('left', '20px');
  $(video_container).css('width', '150px');
  $(video_container).css('height', '150px');
  $(video_container).css('border', '3px solid rgb(0, 216, 255)');
  $(video_container).css('overflow', 'hidden');
  $(video_container).css('z-index', '4');

  navigator.getUserMedia({audio: false, video: true}, function(stream) {
    video.src = window.URL.createObjectURL(stream);
    video.play();
  }, function(error) {
    console.log(error);
  });

});
