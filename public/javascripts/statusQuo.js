//var socket = new io.Socket(null, {port: 8080});
//  socket.connect();
//  socket.on('message', function(obj){
//    console.log(obj)
//  });
if(typeof window.statusQuo === "undefined") {
  var statusQuo = function (params) {
    this.servers = null;
    this.checkOnLoad = params.checkOnLoad || false;
    
    this.getConfig();
  };
  
  statusQuo.prototype = {
    setupPage: function() {
      this.bindButtons();
      if (this.checkOnLoad) {
        console.log(this.checkOnLoad)
        var context = this;
        $('.server').each(function(site){
          context.checkServer($(this));
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
      var context = this;
      //Bind server refresh action
      $('.server a.refresh').click(function(){
        context.checkServer($(this).parents('.server'));
      });
    },
    
    checkServer: function(server) {
      var context = this;
      $(server).addClass("checking").find('.site').each(function(){
        context.checkSite($(this));
      });
    },
    
    checkSite: function(site){
      $(site).addClass('checking');
      $.ajax({ url:'/check/'+$(site).attr('id'), context:site, success: function(data){
        $(this).addClass('s'+data.statusCode).removeClass('checking').find('.message').text(data.message)
        if(data.statusCode == 500)
          $(this).parents('.server').addClass('error');
        if ($(this).siblings('.site:not(.checking)').length == $(this).siblings('.site').length)
          $(this).parents(".server").removeClass("checking");
      }});
    }
  }
};




$(document).ready(function() {
  sq = new statusQuo({
    "checkOnLoad":true
  });
  
  sq.setupPage();
  
  
});