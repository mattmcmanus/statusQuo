//var socket = new io.Socket(null, {port: 8080});
//  socket.connect();
//  socket.on('message', function(obj){
//    console.log(obj)
//  });
if(typeof window.statusQuo === "undefined") {
  var statusQuo = function (params) {
    this.servers = null;
    this.checkOnLoad = params.checkOnLoad || false;
    this.didServerLookup = false;
    //this.socket = new io.Socket(null, {port: 8000, rememberTransport: false});
    //this.getConfig();
  };
  
  statusQuo.prototype = {
    setupPage: function() {
      this.bindButtons();
      this.bindEvents();
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
    
    serverAddService: function(url){
      var servicesNum = $('.service').size()-1,
      service = $('.service.default').clone().removeClass('default');
      service.find('input').each(function(i){
              $(this).attr('name', $(this).attr('name').replace("index",servicesNum));
            })
      if (url) {
        service.find('.name input').val(url)
        service.find('.url input').val('http://'+url);
      }
      service.appendTo('.services').slideDown(200)
    },
    
    bindButtons: function() {
      var context = this;
      //Bind server refresh action
      $('.server a.refresh').click(function(){
        context.refreshServer($(this).parents('.server'));
      });
      
      //Bind server ping action
      $('.server a.ping').click(function(){
        context.pingServer($(this).parents('.server'));
      });
      
      //Bind server ping stop action
      $('.console a.stopPing').click(function(){
        context.stopPing($(this).parents('.server'));
      });
      
      // Add a service button
      $('.server a.add').click(function(){
        context.serverAddService()
      })
      
      var confirmDialog = $('<div class="confirm">Whoa! Are you sure?</div>').hide()
        , yes = $('<a class="button yes">Yes</a>')
        , no = $('<a class="button no">No</a>');
      
      
      $('.buttons .delete a').live("click",function(){
        var confirmDelete = confirmDialog.clone();
        // yes button
        yes.clone().click(function(){
          $("form.delete").submit();
        }).appendTo(confirmDelete);
        // No button
        no.clone().click(function(){
          $(".confirm").remove();
          $('.buttons').removeClass('confirming')
        }).appendTo(confirmDelete);
        $('.buttons').addClass('confirming');
        $(this).after(confirmDelete).next().fadeIn(400)
        return false;
      });
      
      $('.service .delete ').live("click",function(){
        var confirmDelete = confirmDialog.clone();
        // yess
        yes.clone().click(function(){
          var service = $(this).parents(".service")
          if (service.attr("id") != "") {
            service.removeClass('confirming')
                   .addClass('deleted')
                   .children("input.delete").val('true');
            service.find(".message").html('Service will be deleted when you save. (<a href="javascript:void(0)" class="undo")>undo?</a>)').show()
            service.find(".confirm").remove();
          } else {
            service.slideUp(200).delay(500).remove()
          }
        }).appendTo(confirmDelete);
        // no
        no.clone().click(function(){
          var service = $(this).parents(".service");
          service.removeClass('confirming')
                 .find(".confirm").remove();
        }).appendTo(confirmDelete);
        
        $(this).parents('.service').addClass('confirming').append(confirmDelete);
        $(".confirm").fadeIn(400)
        return false;
      });
    },
    
    bindEvents: function() {
      var context = this;
      $('form.new .ip input').blur(function(){
        if ($(this).val().match(/(?:\d{1,3}\.){3}\d{1,3}/) !== null 
          && (context.didServerLookup === false || 
          (!$(this).data('lastIP') || $(this).data('lastIP') !== $(this).val()))) 
            context.serverLookup(this)
        
        $(this).data('lastIP',$(this).val())
      })
    },
    
    refreshServer: function(server) {
      var context = this;
      $(server).find('.loader').show()
      $(server).addClass("checking").find('.service').each(function(){
        context.checkService($(this));
      });
    },
    
    checkService: function(service){
      service.addClass('checking')
      $.ajax({ url:'/server/' + $(service).parents(".server").attr('id') + '/service/' + $(service).attr('id'), context:service, success: function(data){
        $(this).addClass('s'+data.statusCode).removeClass('checking').find('.message').text(data.message)
        if(data.statusCode == 500)
          $(this).parents('.server').addClass('error');
        if ($(this).siblings('.service:not(.checking)').length == $(this).siblings('.service').length)
          $(this).parents(".server").removeClass("checking");
      }});
    },
    
    serverLookup: function(input) {
      var context = this;
      if ($(input).data('lastIP') && $(input).data('lastIP') !== $(input).val()) $('.service').not('.default').slideUp(200).remove()
      $.ajax({ url:'/server/lookup/'+$(input).val(), success: function(data){
        $.each(data, function(key,url){
          context.serverAddService(url)
        })
        context.didServerLookup = true;
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