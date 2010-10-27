$(document).ready(function() {
  $('.site').each(function(index){
    var id = $(this).attr('id');
    var context = $(this);
    $.ajax({ url:'/ping/'+id, context:context, success: function(data){
      $(this).find('em').text(data).parent().addClass('s'+data)
    }});
  })
});