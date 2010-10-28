//var socket = new io.Socket(null, {port: 8080});
//  socket.connect();
//  socket.on('message', function(obj){
//    console.log(obj)
//  });

$(document).ready(function() {
  $('.site').each(function(index){
    var id = $(this).attr('id');
    var context = $(this);
    $.ajax({ url:'/ping/'+id, context:context, success: function(data){
      $(this).addClass('s'+data.status).removeClass('pinging').find('.statusCode').text(data.status)
    }});
  })
});