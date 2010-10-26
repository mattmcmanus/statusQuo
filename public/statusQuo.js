$.fn.highlight = function(highlightColor, duration) {
  var highlightBg = highlightColor || "#FFFF9C";
  var animateMs = duration || 1500;
  var originalBg = this.css("backgroundColor");
  this.stop().css("background-color", highlightBg).animate({backgroundColor: originalBg}, animateMs);
};
$(document).ready(function() {
  $('.sites li').each(function(index){
    var id = $(this).attr('id');
    var context = $(this);
    $.ajax({ url:'/ping/'+id, context:context, success: function(data){
      $(this).find('em').text(data).parent().highlight("#ffff66",1000)
    }});
  })
});