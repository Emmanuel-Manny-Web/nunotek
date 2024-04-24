(function ($) {
    "use strict";
    var $main_nav = $('#main-nav');
    var $toggle = $('.toggle');
    var defaultOptions = {
        disableAt: false,
        customToggle: $toggle,
        levelSpacing: 40,
        navTitle: 'VIP-Alat',
        levelTitles: true,
        levelTitleAsBack: true,
        pushContent: '#container',
        insertClose: 2
    };
    var Nav = $main_nav.hcOffcanvasNav(defaultOptions);
    $('.landing-slider').slick({dots: true, autoplay: true, nextArrow: false, prewArrow: false,});
    $('.top-doctors').slick({
        infinite: false,
        dots: false,
        arrows: false,
        speed: 300,
        autoplay: false,
        slidesToShow: 2.2,
        slidesToScroll: 1,
    });
    $('.available-doctor').slick({
        infinite: false,
        dots: false,
        arrows: true,
        speed: 300,
        autoplay: true,
        slidesToShow: 1.2,
        slidesToScroll: 1,
    });
    $('.recent-doctors').slick({
        infinite: false,
        dots: false,
        arrows: false,
        speed: 300,
        autoplay: false,
        slidesToShow: 2.2,
        slidesToScroll: 1,
    });
})(jQuery);