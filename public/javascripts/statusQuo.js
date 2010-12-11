//var socket = new io.Socket(null, {port: 8080});
//  socket.connect();
//  socket.on('message', function(obj){
//    console.log(obj)
//  });
if(typeof window.statusQuo === "undefined") {
  var statusQuo = function (params) {
    this.servers = null;
    
    this.getConfig();
  };
  
  statusQuo.prototype = {
    getConfig: function(){
      var context = this;
      $.getJSON('/getConfig', function(data) {
        context.servers = data;
      });
    },
    check: function(id){
      var context = $('#'+id);
      $.ajax({ url:'/check/'+id, context:context, success: function(data){
        $(this).addClass('s'+data.statusCode).removeClass('checking').find('.message').text(data.message)
        if(data.statusCode == 500)
          $(this).parents('.server').addClass('error');
      }});
    }
  }
};


sq = new statusQuo({});

$(document).ready(function() {
  
  $('.site').each(function(index){
    sq.check($(this).attr('id'));
  })
});