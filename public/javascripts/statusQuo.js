if(typeof window.statusQuo === "undefined") {
  var statusQuo = function (params) {
    this.servers = null;
    this.checkOnLoad = params.checkOnLoad || false;
    this.autoRefresh = true;
    this.autoRefreshFunction = null;
    this.autoRefreshInterval = params.autoRefreshInterval || 300;
    this.autoRefreshCountdown = this.autoRefreshInterval;
    this.didServerLookup = false;
    this.socket = new io.Socket(null, {port: 8000, rememberTransport: false});
    //this.getConfig();
  };
  
  statusQuo.prototype = {
    setupPage: function() {
      var context = this
      this.bindButtons()
      this.bindEvents()
      if (this.checkOnLoad && $('body').hasClass('front')) {
        if (this.autoRefresh)
          this.autoRefreshFunction = setInterval("sq.autoDashboardRefresh()", 1000)
        this.dashboardRefresh()
      } 
    },
    
    //              Binding Buttons & Events
    // - - - - - - - - - - - - - - - - - - - - - - - - -
    bindButtons: function() {
      var context = this;
      $('.front #refresh')
        .click(function(){ context.dashboardRefresh() });

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
      
      
      $('.buttons .delete').live("click",function(){
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
    
    
    //                     The Curtain
    // - - - - - - - - - - - - - - - - - - - - - - - - -
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
    
    
    //                  Servers
    // - - - - - - - - - - - - - - - - - - - - - - - - -
    dashboardRefresh: function() {
      var context = this;
      if (context.autoRefresh) context.autoRefreshCountdown = context.autoRefreshInterval;
      $('.server').each(function(){
        context.serverCheck($(this))
      })
    },
    
    autoDashboardRefresh: function() {
      var context = this;
      sq.autoRefreshCountdown--
      if (context.autoRefreshCountdown == 0)   {
         sq.dashboardRefresh()
         return;
      }
      $(".countdown").html("Refresh in <strong>" + sq.autoRefreshCountdown + "</strong> seconds");
    },
    
    serverCheck: function(server) {
      if (typeof event != "undefined") event.stopPropagation();
      var context = this;
      $(server).addClass("checking").find('.loader').show()
      
      $.ajax({ url:'/server/' + $(server).attr('id') + '/status/'
        , context:server
        , success: function(data){
            console.log(data)
            var server = $(this);
            
            $(server).removeClass('checking').find(".services li").remove()
            $.each(data, function(status, services){
              if(services > 0) {
                $(server).addClass(status).find(".services ul").append('<li class="'+status+'"><span class="count">'+services+'</span>'+status)
              }
            })
          }
      })
    },
    
    serverDetail: function(server){
      var context = this;
      $.get('/server/'+$(server).attr('id'), function(server){
        context.curtainOpen(server);
        var server_id = $(server).attr('id');
        context.socket.connect();
        context.serverPing(server_id)
        //$('#'+server_id+' .service').each(function(){
        //  context.serviceCheck(this)
        //})
      });
    },
    
    serverPing: function(server_id) {
      var context = this
        , server = $('#'+server_id);
      $(server).addClass("pinging");
      var smoothie = new SmoothieChart({ grid: { strokeStyle: 'rgb(45, 45, 45)', fillStyle: 'rgb(34, 34, 34)', lineWidth: 1, millisPerLine: 500, verticalSections: 3 } });
      smoothie.streamTo(document.getElementById("ping_graph"), 750);
      var ping = new TimeSeries();
      context.socket.send({'ping':$(server).data('ip')});
      context.socket.on('message', function(output){
        $('.ping .responseTime').delay(1000).html(output.time + "<em>ms</em>")
        ping.append(new Date().getTime(), parseFloat(output.time))
      });
      smoothie.addTimeSeries(ping, { strokeStyle:'rgb(200, 200, 200)', fillStyle:'rgba(255, 255, 255, 0.1)', lineWidth:2 })
        
    },
    
    //                  Services
    // - - - - - - - - - - - - - - - - - - - - - - - - -
    serviceCheck: function(service){
      $(service).addClass('checking')
      $.ajax({ url:'/server/' + $(service).data('server') + '/service/' + $(service).attr('id'), context:service, success: function(data){
        $(this).addClass(data.status).removeClass('checking')
        $(this).find('.message').text(data.message)
        if ($(this).siblings('.service:not(.checking)').length == $(this).siblings('.service').length)
          $(this).parents(".server").removeClass("checking");
      }});
    },
    
    //                Server Form
    // - - - - - - - - - - - - - - - - - - - - - - - - -
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
    }
  }
};

$(document).ready(function() {
  sq = new statusQuo({
    "checkOnLoad":true
  });
  
  sq.setupPage();
  
  function split( val ) {
			return val.split( /,\s*/ );
		}
		function extractLast( term ) {
			return split( term ).pop();
		}

		$("form .type input")
			// don't navigate away from the field on tab when selecting an item
			.bind( "keydown", function( event ) {
				if ( event.keyCode === $.ui.keyCode.TAB &&
						$( this ).data( "autocomplete" ).menu.active ) {
					event.preventDefault();
				}
			})
			.autocomplete({
				source: function( request, response ) {
					$.getJSON( "/tag/"+extractLast(request.term), response );
				},
				search: function() {
					// custom minLength
					var term = extractLast( this.value );
					if ( term.length < 2 ) {
						return false;
					}
				},
				focus: function() {
					// prevent value inserted on focus
					return false;
				},
				select: function( event, ui ) {
					var terms = split( this.value );
					// remove the current input
					terms.pop();
					// add the selected item
					terms.push( ui.item.value );
					// add placeholder to get the comma-and-space at the end
					terms.push( "" );
					this.value = terms.join( ", " );
					return false;
				}
			});
  
  $('#messages .success').delay(3000).slideUp(100)
});