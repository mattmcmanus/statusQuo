//var socket = new io.Socket(null, {port: 8080});
//  socket.connect();
//  socket.on('message', function(obj){
//    console.log(obj)
//  });
if(typeof window.statusQuo === "undefined") {
  var statusQuo = function (params) {
    this.servers = null;
    this.checkOnLoad = true || params.checkOnLoad;
    
    this.getConfig();
  };
  
  statusQuo.prototype = {
    setupPage: function() {
      this.bindButtons();
      if (this.checkOnLoad) {
        var context = this;
        $('.sites').each(function(site){
          var id = $(this).attr('id');
          context.check(id);
        })
      }
    },
    
    getConfig: function(){
      var context = this;
      $.getJSON('/getConfig', function(data) {
        context.servers = data;
      });
    },
    
    bindButtons: function() {
      //Bind server refresh action
      $('.server a.refresh').click(function(){
        $(this).parent().next().children().each(function(){
          sq.check($(this).attr('id'))
        });
      });
    },
    
    check: function(id){
      var context = $("#"+id);
      $(context).addClass('checking');
      $.ajax({ url:'/check/'+id, context:context, success: function(data){
        $(this).addClass('s'+data.statusCode).removeClass('checking').find('.message').text(data.message)
        if(data.statusCode == 500)
          $(this).parents('.server').addClass('error');
      }});
    }
  }
};

sq = new statusQuo({
  "checkOnLoad":false
});


$(document).ready(function() {
  sq.setupPage();
  
  
});