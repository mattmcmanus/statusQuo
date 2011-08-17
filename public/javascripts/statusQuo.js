if(typeof window.statusQuo === "undefined") {
  var statusQuo = function (params) {
    this.servers = null;
    this.socket = params.socket || false;
    this.checkOnLoad = params.checkOnLoad || false;
    this.autoRefresh = true;
    this.autoRefreshFunction = null;
    this.autoRefreshInterval = params.autoRefreshInterval || 300;
    this.autoRefreshCountdown = this.autoRefreshInterval;
    //this.getConfig();
  };
  
  statusQuo.prototype = {
    setupPage: function() {
      var context = this
      this.bindButtons()
      this.bindEvents()
      if ($('body').hasClass('front')) {
        if (this.checkOnLoad) {
          if (this.autoRefresh) this.autoRefreshFunction = setInterval("sq.autoDashboardRefresh()", 1000)
          this.dashboardRefresh()
        } 
        this.announcementsLoad()
        
      };
      
      
    },
    
    //              Binding Buttons & Events
    // - - - - - - - - - - - - - - - - - - - - - - - - -
    bindButtons: function() {
      var context = this;
      // Add a server button
      $('#server_add').click(function(){
        //context.serverAdd()
        //return false
      })
      
      $('#announcement_add')
        .click(function(e){ e.preventDefault(); context.announcementAdd(); return false; });
        
      $('#curtain a.cancel, #curtain a.close')
        .live('click', function(){context.curtainClose(); return false})
      
      // Refresh the dashboard view
      $('.front #refresh')
        .click(function(){ context.dashboardRefresh() });

      // View the detail of a server
      $('.front .server')
        .click(function(){ context.serverDetail($(this)) });
      
      //Refresh an individual servers status
      $('.server a.refresh')
        .bind('click', function(){ context.serverStatus($(this).parents('.server'), "check"); return false });
      
      // For submission   
      $('form.server .submit').bind('click', function(event){
        event.preventDefault()
        $('.service').each(function(i){
          $(this).find('input').each( function(){
            $(this).attr('name', $(this).attr('name').replace("$n",i));
          })
        })
        $('form.server').submit()
      })
      
      // Add a service button
      $('.server a.addService')
        .live('click', function(){ context.serverAddService() });
      
      $('form.server .service .delete').bind("click",function(event){
        context.serverDeleteService(event)
      })
      
      $('form.server .buttons .delete').bind("click",function(event){
        event.preventDefault()
        $('.buttons').addClass('confirming');
        View('confirm')
          .question('Whoa! Are you sure you want to delete this server?')
          .no(function(){ $('.confirm').remove();  $('.buttons').removeClass('confirming') })
          .yes(function(){ $("form.delete").submit() })
          .appendTo('.form-submit')
      });
    },
    
    bindEvents: function() {
      var context = this;
      
      $('#curtain div, #curtain form, #curtain li').bind('click', function(event) { 
        event.stopPropagation();
      })
      //$('#curtain').bind('click', function(event) { event.stopPropagation();context.curtainClose()})
      
      // Bind keyboard shortcuts
      $(window).keydown(function(event) {
        if (event.which == 27) //Escape key!
          context.curtainClose()
      });
      
      
    },
    
    
    //                     The Curtain
    // - - - - - - - - - - - - - - - - - - - - - - - - -
    curtainOpen: function(modal){
      if (modal) $('#curtain').append(modal)
      $('#curtain').height(window.innerHeight).fadeIn(200);
    },
    
    curtainClose: function(){
      var context = this
      
      if (context.socket)
        context.socket.emit('ping-kill')
      $("#curtain:visible").fadeOut(200).children().remove()
    },
    
    //                  Announcements
    // - - - - - - - - - - - - - - - - - - - - - - - - -
    announcementAdd: function() {
      var context = this
        , announcement = View('announcement-form')
      announcement.appendTo('#curtain')
      announcement.submit.json(function(res){
        context.curtainClose()
        context.announcementsLoad()
      });
      
      context.curtainOpen()
    },
    
    announcementsLoad: function() {
      $.get('announcements', function(announcements) {
        $('#announcements ul').html(announcements)
      })
    },
    
    
    //                  Servers
    // - - - - - - - - - - - - - - - - - - - - - - - - -
    dashboardRefresh: function() {
      var context = this;
      if (context.autoRefresh) context.autoRefreshCountdown = context.autoRefreshInterval;
      $('#main .server').each(function(){
        context.serverStatus($(this))
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
    
    // Type is null or status to do a read only status check. Type is "check" to do a manual check
    serverStatus: function(server, type) {
      if (typeof event != "undefined") event.stopPropagation();
      if (!type) type = "status"
      
      var context = this;
      $(server).addClass("checking").find('.loader').show()
      
      $.ajax({ url:'/server/' + $(server).attr('id') + '/'+ type +'/'
        , context:server
        , success: function(data){
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
    
    serverAdd: function(){
      var context = this;
      $.get('/server/new', function(server){
        context.curtainOpen(server);
      })
    },
    
    serverAddService: function(url){
      var context = this
      View('service-form')
        .delete(function(e){ context.serverDeleteService(e) })
        .appendTo('form.server .services')
    },
    
    serverDeleteService: function(e) {
      var service = $(e.currentTarget).parents('.service')
      service.addClass('confirming')
      View('confirm')
        .question('Whoa! Are you sure you want to delete this service?')
        .no(function(){ service.removeClass('confirming').find('.confirm').remove() })
        .yes(function(){
          if (service.attr("id") != "") {
            service.removeClass('confirming')
                   .addClass('deleted')
                   .find("input.delete").val('true');
            service.find(".message").html('Service will be deleted when you save. (<a href="javascript:void(0)" class="undo")>undo?</a>)').show()
            service.find(".confirm").remove();
          } else {
            service.slideUp(200)
            setTimeout(function(){service.remove()},200)
          }
        })
        .appendTo(service)
    },
    
    serverDetail: function(server){
      var context = this;
      $.get('/server/'+$(server).attr('id'), function(server){
        context.curtainOpen(server);
        var server_id = $(server).attr('id');
        if (context.socket) context.serverPing(server_id)
      });
    },
    
    serverPing: function(server_id) {
      var context = this
        , server = $('#'+server_id)
        , socket = context.socket
        , smoothie = new SmoothieChart({ grid: { strokeStyle: 'rgb(45, 45, 45)', fillStyle: 'rgb(34, 34, 34)', lineWidth: 1, millisPerLine: 500, verticalSections: 3 } })
        , ping = new TimeSeries()
        
        smoothie.streamTo(document.getElementById("ping_graph"), 750);
        
      socket.emit('ping', $(server).data('ip'), function(status){
        if (status) {
          $(server).addClass("pinging")
        } else
          console.error("Ping did not start successfully")
      });

      socket.on('ping-response', function(output){
        console.log(output)
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
    }
  }
};


// - - - - - - - - - - - - - - - - - - - - - - - - - - - 
//              Ready, Go!!
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
$(document).ready(function() {
  sq = new statusQuo({
    "checkOnLoad":true
  , socket:false // io.connect();
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

