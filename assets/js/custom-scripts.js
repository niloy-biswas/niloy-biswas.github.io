(function($) {
  "use strict";
  
    $.fn.andSelf = function() {
      return this.addBack.apply(this, arguments);
    }
  
      /* Loader Code Start */
      $(window).on("load", function() { 
        $(".section-loader").fadeOut("slow");
        
        var $container = $('#mh-portfolio .portfolioContainer');
        $container.isotope({
            filter: '*',
            animationOptions: {
                queue: true
            }
        });
     
        $('#mh-portfolio .portfolio-nav li').click(function(){
            $('#mh-portfolio .portfolio-nav .current').removeClass('current');
            $(this).addClass('current');
     
            var selector = $(this).attr('data-filter');
            $container.isotope({
                filter: selector,
                animationOptions: {
                    queue: true
                }
             });
             return false;
        });
      });
      /* Loader Code End */


      // var height = $('.mh-service-item').height();
      // if($(window).width()){
      //   $('.mh-service-item').css('height', height);   
      //   $('.mh-service-item').css('height', height);   
      // }
  

      $(window).on('load', function() {
        $('#header-slider #animation-slide').owlCarousel({
               autoHeight: true,
               items: 1,
               loop: true,
               autoplay: true,
               dots: false,
               nav: false,
               autoplayTimeout: 3000,
               navText: ["<i class='fa fa-angle-left'></i>", "<i class='fa fa-angle-right'></i>"],
               animateIn: "zoomIn",
               animateOut: "fadeOutDown",
               autoplayHoverPause: false,
               touchDrag: true,
               mouseDrag: true
           });
         $("#animation-slide").on("translate.owl.carousel", function () {
             $(this).find(".owl-item .slide-text > *").removeClass("fadeInUp animated").css("opacity","0");
             $(this).find(".owl-item .slide-img").removeClass("fadeInRight animated").css("opacity","0");
         });          
         $("#animation-slide").on("translated.owl.carousel", function () {
             $(this).find(".owl-item.active .slide-text > *").addClass("fadeInUp animated").css("opacity","1");
             $(this).find(".owl-item.active .slide-img").addClass("fadeInRight animated").css("opacity","1");
         });
     });
   
    /*
    |====================
    | Mobile NAv trigger
    |=====================
    */
    
    var trigger = $('.navbar-toggler'),
      overlay     = $('.overlay'),
      navc     = $('.navbar-collapse'),
      active      = false;
  

      $('.navbar-toggler, .navbar-nav li a, .overlay').on('click', function () {
          $('.navbar-toggler').toggleClass('active')
        //   $('#js-navbar-menu').toggleClass('active');
        //   $('.navbar-collapse').toggleClass('show');
          overlay.toggleClass('active');
          navc.toggleClass('active');
      });  
      
        
    /*
    |=================
    | Onepage Nav
    |================
    */
        
      $('#mh-header').onePageNav({
          currentClass: 'active', 
          changeHash: false,
          scrollSpeed: 750,
          scrollThreshold: 0.5,
      });
    
    /*
    |=================
    | fancybox
    |================
    */
 
      $("[data-fancybox]").fancybox({});
      
      
    /*
    |===============
    | WOW ANIMATION
    |==================
    */
    	var wow = new WOW({
          mobile: false  // trigger animations on mobile devices (default is true)
      });
      wow.init();
      
      
    /*
    |=================
    | AOS
    |================
    */      
      
      //AOS.init();
  
    /*
    | ==========================
    | NAV FIXED ON SCROLL
    | ==========================
    */
    $(window).on('scroll', function() {
        var scroll = $(window).scrollTop();
        if (scroll >= 50) {
            $(".nav-scroll").addClass("nav-strict");
        } else {
            $(".nav-scroll").removeClass("nav-strict");
        }
    });
    

    /*
    |=================
    | Progress bar
    |================
    */   
    $(".determinate").each(function(){
      var width = $(this).text();
      $(this).css("width", width)
        .empty()
        .append('<i class="fa fa-circle"></i>');                
    });
    
    /*
    |=================
    | Portfolio mixin
    |================
    */   
    $('#portfolio-item').mixItUp();
    
    /*
    |=================
    | Client review
    |================
    */   
    //  $('#mh-client-review').owlCarousel({
    //     loop: false,
    //     responsiveClass: true,
    //     nav: true,
    //     autoplay: false,
    //     smartSpeed: 450,
    //     stopOnHover : true,
    //     animateIn: 'slideInRight',
    //     animateOut: 'slideOutLeft',
    //     autoplayHoverPause: true,
    //     responsive: {
    //       0: {
    //         items: 1,
    //       },
    //       768: {
    //         items: 2,
    //       },
    //       1170: {
    //         items: 3,
    //       }
    //     }
    // });  
    
    /*
    |=================
    | Project review slide
    |================
    */   
    // $('.mh-project-testimonial').owlCarousel({
    //     loop: true,
    //     responsiveClass: true,
    //     nav: false,
    //     dots: false,
    //     autoplay: true,
    //     smartSpeed: 450,
    //     stopOnHover : true,
    //     animateIn: 'slideInRight',
    //     animateOut: 'slideOutLeft',
    //     autoplayHoverPause: true,
    //     pagination: false,
    //     responsive: {
    //       0: {
    //         items: 1,
    //       },
    //       768: {
    //         items: 1,
    //       },
    //       1170: {
    //         items: 1,
    //       }
    //     }
    // });     
    
    /*
    |=================
    | Single Project review
    |================
    */   
    // $('#single-project').owlCarousel({
    //     loop: false,
    //     responsiveClass: true,
    //     nav: false,
    //     dots: true,
    //     autoplay: false,
    //     smartSpeed: 450,
    //     stopOnHover : true,
    //     animateIn: 'slideInRight',
    //     animateOut: 'slideOutLeft',
    //     autoplayHoverPause: true,
    //     pagination: false,
    //     responsive: {
    //       0: {
    //         items: 1,
    //       },
    //       768: {
    //         items: 1,
    //       },
    //       1170: {
    //         items: 1,
    //       }
    //     }
    // });    
    
    /*
    |=================
    | Project review slide
    |================
    */   
    // $('.mh-single-project-slide-by-side').owlCarousel({
    //     loop: false,
    //     responsiveClass: true,
    //     nav: true,
    //     navText: ["<i class='fa fa-angle-left'></i>", "<i class='fa fa-angle-right'></i>"],
    //     dots: false,
    //     autoplay: false,
    //     smartSpeed: 450,
    //     stopOnHover : true,
    //     animateIn: 'slideInRight',
    //     animateOut: 'slideOutLeft',
    //     autoplayHoverPause: true,
    //     pagination: false,
    //     responsive: {
    //       0: {
    //         items: 1,
    //       },
    //       768: {
    //         items: 1,
    //       },
    //       1170: {
    //         items: 1,
    //       }
    //     }
    // });     
    
    /*
    |=================
    | Single client review
    |================
    */   
    // $('#mh-single-client-review').owlCarousel({
    //     loop: false,
    //     responsiveClass: true,
    //     nav: true,
    //     autoplay: false,
    //     smartSpeed: 450,
    //     stopOnHover : true,
    //     animateIn: 'slideInRight',
    //     animateOut: 'slideOutLeft',
    //     autoplayHoverPause: true,
    //     responsive: {
    //       0: {
    //         items: 1,
    //       },
    //       768: {
    //         items: 1,
    //       },
    //       1170: {
    //         items: 1,
    //       }
    //     }
    // });   
    // */   
    // $('#mh-single-client-review').owlCarousel({
    //     loop: false,
    //     responsiveClass: true,
    //     nav: true,
    //     autoplay: false,
    //     smartSpeed: 450,
    //     stopOnHover : true,
    //     animateIn: 'slideInRight',
    //     animateOut: 'slideOutLeft',
    //     autoplayHoverPause: true,
    //     responsive: {
    //       0: {
    //         items: 1,
    //       },
    //       768: {
    //         items: 1,
    //       },
    //       1170: {
    //         items: 1,
    //       }
    //     }
    // });   
    
    /*
    |=================
    | Clint review slide
    |================
    */   
    // $('#mh-2-client-review').owlCarousel({
    //     loop: false,
    //     responsiveClass: true,
    //     nav: true,
    //     autoplay: false,
    //     smartSpeed: 450,
    //     stopOnHover : true,
    //     animateIn: 'slideInRight',
    //     animateOut: 'slideOutLeft',
    //     autoplayHoverPause: true,
    //     responsive: {
    //       0: {
    //         items: 1,
    //       },
    //       768: {
    //         items: 2,
    //       },
    //       1170: {
    //         items: 2,
    //       }
    //     }
    // });
    
    
    // Smooth Scroll
        $(function() {
          $('a[href*=#]:not([href=#])').click(function() {
            if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
              var target = $(this.hash);
              target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
              if (target.length) {
                $('html,body').animate({
                  scrollTop: target.offset().top
                }, 600);
                return false;
              }
            }
          });
        });
        
        
        
    /*
    |=================
    | CONTACT FORM
    |=================
    */
      document.addEventListener("DOMContentLoaded", function() {
        const form = document.getElementById("contactForm");
        const msgSubmit = document.getElementById("msgSubmit");
      
        function showSuccess() {
          form.reset();
          msgSubmit.textContent = "Your message has been sent successfully!";
          msgSubmit.classList.remove("hidden", "text-danger", "shake");
          msgSubmit.classList.add("text-success", "fadeInUp");
        }
      
        function showError() {
          msgSubmit.textContent = "Oops! There was a problem sending your message.";
          msgSubmit.classList.remove("hidden", "text-success", "fadeInUp");
          msgSubmit.classList.add("text-danger", "shake");
        }
      
        form.addEventListener("submit", function(ev) {
          ev.preventDefault();
          const data = new FormData(form);
          ajax(form.method, form.action, data, showSuccess, showError);
        });
      
        function ajax(method, url, data, successCallback, errorCallback) {
          const xhr = new XMLHttpRequest();
          xhr.open(method, url);
          xhr.setRequestHeader("Accept", "application/json");
          xhr.onreadystatechange = function() {
            if (xhr.readyState !== XMLHttpRequest.DONE) return;
            if (xhr.status === 200) {
              successCallback();
            } else {
              errorCallback();
            }
          };
          xhr.send(data);
        }
      });
    

      /*
      MOVING Cursor
      */
      var TxtRotate = function(el, toRotate, period) {
        this.toRotate = toRotate;
        this.el = el;
        this.loopNum = 0;
        this.period = parseInt(period, 10) || 2000;
        this.txt = this.toRotate[0]; // Start with the first text
        this.isDeleting = false;
      };
      
      TxtRotate.prototype.start = function() {
        // Set initial text
        this.el.innerHTML = '<span class="wrap">' + this.txt + '</span>';
        
        // Start the rotation after a delay
        setTimeout(() => {
          this.isDeleting = true;
          this.tick();
        }, 2000); // Wait 2 seconds before starting rotation
      };
      
      TxtRotate.prototype.tick = function() {
        var i = this.loopNum % this.toRotate.length;
        var fullTxt = this.toRotate[i];
      
        if (this.isDeleting) {
          this.txt = fullTxt.substring(0, this.txt.length - 1);
        } else {
          this.txt = fullTxt.substring(0, this.txt.length + 1);
        }
      
        this.el.innerHTML = '<span class="wrap">' + this.txt + '</span>';
      
        var that = this;
        var delta = 100 - Math.random() * 50; // Change it to lower for making the characters speed faster
      
        if (this.isDeleting) { delta /= 4; }
      
        if (!this.isDeleting && this.txt === fullTxt) {
          delta = this.period;
          this.isDeleting = true;
        } else if (this.isDeleting && this.txt === '') {
          this.isDeleting = false;
          this.loopNum++;
          delta = 500;
        }
      
        setTimeout(function() {
          that.tick();
        }, delta);
      };
      
      window.onload = function() {
        var elements = document.getElementsByClassName('wow fadeInUp');
        for (var i=0; i<elements.length; i++) {
          var toRotate = elements[i].getAttribute('data-rotate');
          var period = elements[i].getAttribute('data-period');
          if (toRotate) {
            var rotate = new TxtRotate(elements[i], JSON.parse(toRotate), period);
            rotate.start();
          }
        }
      };


    
    
  
      
}(jQuery));
