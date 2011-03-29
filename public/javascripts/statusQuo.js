
if(typeof window.statusQuo === "undefined") {
  var statusQuo = function (params) {
    this.servers = null;
    this.checkOnLoad = params.checkOnLoad || false;
    this.didServerLookup = false;
    this.socket = new io.Socket(null, {port: 8000, rememberTransport: false});
    //this.getConfig();
  };
  
  statusQuo.prototype = {
    setupPage: function() {
      var context = this;
      this.bindButtons();
      this.bindEvents();
      if (this.checkOnLoad) {
        $('.server').each(function(site){
          context.serverCheck($(this));
        })
      }
    },
    
    bindButtons: function() {
      var context = this;
      
      $('.front .server')
        .bind('click', function(){ context.serverDetail($(this)) });
      
      //Bind server refresh action
      $('.server a.refresh')
        .bind('click', function(){ context.serverCheck($(this).parents('.server')); return false });
      
      // Add a service button
      $('.server a.add')
        .click(function(){ context.serverAddService() });
      
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
      
      $('#curtain').click(function(){context.curtainClose()})
    },
    
    curtainOpen: function(modal){
      $('#curtain').append(modal). height(window.innerHeight).fadeIn(200);
    },
    
    curtainClose: function(){
      var context = this
        , curtain = $("#curtain");
      
      if (curtain.has('.server.detail').length)
        context.socket.send({'kill':'ping'});
      
      curtain.fadeOut(200).children().remove()
    },
    
    
    
    serverCheck: function(server) {
      event.stopPropagation();
      var context = this;
      $(server).addClass("checking").find('.loader').show()
      
      $.ajax({ url:'/server/' + $(server).attr('id') + '/check/'
        , context:server
        , success: function(data){
            var server = $(this);
            $(server).removeClass('checking')
            $.each(data, function(status, services){
              if(services.length) {
                $(server).addClass(status).find(".services ul").append('<li class="'+status+'"><span class="count">'+services.length+'</span>'+status)
              }
            })
          }
      })
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
    
    serverDetail: function(server){
      var context = this;
      $.get('/server/'+$(server).attr('id'), function(server){
        context.curtainOpen(server);
        var server_id = $(server).attr('id');
        context.socket.connect();
        context.socket.on('connect', function(){ 
          console.log("Client: Connected")
        })
        context.serverPing(server_id)
        $('#'+server_id+' .service').each(function(){
          context.serviceCheck(this)
        })
      });
      
    },
    
    serverAddService: function(url){
      var servicesNum = $('.service').size()-1,
      service = $('.default .service').clone();
      service.find('input').each(function(i){
              $(this).attr('name', $(this).attr('name').replace("index",servicesNum));
            })
      if (url) {
        service.find('.name input').val(url)
        service.find('.url input').val('http://'+url);
      }
      service.appendTo('.services').slideDown(200)
    },
    
    serverPing: function(server_id) {
      var context = this
        , server = $('#'+server_id);
      $(server).addClass("pinging");
      var smoothie = new SmoothieChart({ grid: { strokeStyle: 'rgb(45, 45, 45)', fillStyle: 'rgb(34, 34, 34)', lineWidth: 1, millisPerLine: 500, verticalSections: 3 } });
      smoothie.streamTo(document.getElementById("ping_graph"), 500);
      var ping = new TimeSeries();
      context.socket.send({'ping':$(server).data('ip')});
      context.socket.on('message', function(output){
        //server.find('.ping .output').text(output.time)
        ping.append(new Date().getTime(),parseFloat(output.time))
      });
      smoothie.addTimeSeries(ping, { strokeStyle:'rgb(200, 200, 200)', fillStyle:'rgba(255, 255, 255, 0.1)', lineWidth:2 })
        
    },
    
    serviceCheck: function(service){
      $(service).addClass('checking')
      console.log($(service).data('server'))
      $.ajax({ url:'/server/' + $(service).data('server') + '/service/' + $(service).attr('id'), context:service, success: function(data){
        $(this).addClass(data.status).removeClass('checking')
        $(this).find('.message').text(data.message)
        if ($(this).siblings('.service:not(.checking)').length == $(this).siblings('.service').length)
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
  
  $('#messages .success').delay(3000).slideUp(100)
});