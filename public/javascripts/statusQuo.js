//var socket = new io.Socket(null, {port: 8080});
//  socket.connect();
//  socket.on('message', function(obj){
//    console.log(obj)
//  });
if(typeof window.statusQuo === "undefined") {
  var statusQuo = function (params) {
    this.servers = null;
    this.checkOnLoad = params.checkOnLoad || false;
    
    //this.socket = new io.Socket(null, {port: 8000, rememberTransport: false});
    //this.getConfig();
  };
  
  statusQuo.prototype = {
    setupPage: function() {
      this.bindButtons();
      if (this.checkOnLoad) {
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
      
      //Bind server ping action
      $('.server a.ping').click(function(){
        context.pingServer($(this).parents('.server'));
      });
      
      //Bind server ping stop action
      $('.console a.stopPing').click(function(){
        context.stopPing($(this).parents('.server'));
      });
      
      $('.server a.add').click(function(){
        var servicesNum = $('.service').size()-1,
        service = $('.service.default').clone().removeClass('default').show();
        service.find('input').each(function(i){
                $(this).attr('name', $(this).attr('name').replace("index",servicesNum));
              })
        service.appendTo('.services')
      })
      
      $('.buttons a.delete').live("click",function(){
        var confirm = $('<div class="confirm">Whoa! Are you sure?</div>').hide();
        // yes button
        $('<a class="button yes">Yes</a>').click(function(){
          $("form.delete").submit();
        }).appendTo(confirm);
        // No button
        $('<a class="button no">No</a>').click(function(){
          $(".confirm").remove();
          $('.button').fadeTo(100,1)
          $('.buttons').removeClass('confirming')
        }).appendTo(confirm);
        $('.buttons').addClass('confirming');
        $('.button').fadeTo(300,.2)
        $(this).fadeTo(100,0).after(confirm).next().fadeIn(400)
        return false;
      });
      
      $('.service a.delete').live("click",function(){
        var confirm = $('<div class="confirm">Whoa! Are you sure?</div>').hide();
        $('<a class="button yes">Yes</a>').click(function(){
          var service = $(".service.confirming")
          if (service.attr("id") != "") {
            service.removeClass('confirming').addClass('deleted').children("input.delete").val('true');
            service.find(".message").html('Service will be deleted. (<a href="javascript:void(0)" class="undo")>undo?</a>)').show()
            $(".confirm").remove();
          } else {
            service.remove()
          }
        }).appendTo(confirm);
        $('<a class="button no">No</a>').click(function(){
          $(".confirm").remove();
          $('.service li').fadeTo(100,1)
          $('.service').removeClass('confirming')
        }).appendTo(confirm);
        $(this).parent().siblings().fadeTo(300,.1)
               .parents('.service').addClass('confirming').append(confirm);
        $(".confirm").fadeIn(400)
        return false;
      });
    },
    
    checkServer: function(server) {
      var context = this;
      $(server).find('.site').show()
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
    },
    
    pingServer: function(server) {
      var context = this;
      $(server).addClass("pinging");
      $(server).find('.console').slideDown(150)
      //context.socket.connect();
      //context.socket.on('connect', function(){ 
      //  console.log("Client: Connecting")
      //})
      //context.socket.send({'ping':$(server).attr('id')});
      //context.socket.on('message', function(obj){
      //  console.log(obj)
      //});
        
    },
    
    stopPing: function(server) {
      server.children('.console').slideUp(150)
    }
  }
};




$(document).ready(function() {
  sq = new statusQuo({
    "checkOnLoad":false
  });
  
  sq.setupPage();
  
  $('#messages .success').delay(3000).slideUp(100)
});