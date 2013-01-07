$(function(){

    // make code pretty
    window.prettyPrint && prettyPrint();

    $('aside > .nav-list').affix({
        offset: {
            top: $('aside > .nav-list').offset().top - 20
        }
    });

    $(window).resize(function(){
        $('[data-spy="scroll"]').scrollspy('refresh');
    });

});
