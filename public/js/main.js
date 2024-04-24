"use strict";
let activeElem = '',
    stopScroll = 1,
    ipAddress = '',
    timerOn = true,
    paginationWrapper ='';
const elem = document.querySelectorAll('div, a, button, span, select, ul, li, input,header,form,p,body');
function docReady(fn) {
    // see if DOM is already available
    if (document.readyState === "complete" || document.readyState === "interactive") {
        // call on next available tick
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

docReady(function() {
    elem.forEach(function (s) {
        if (s.classList.contains('pswd_eye')) {
            s.addEventListener('click', function (e) {
                if (this.previousElementSibling.type == "password") {
                    this.children[0].classList.remove('fa-eye');
                    this.children[0].classList.add('fa-eye-slash');
                    this.previousElementSibling.type = "text";
                }
                else{
                    this.children[0].classList.add('fa-eye');
                    this.children[0].classList.remove('fa-eye-slash');
                    this.previousElementSibling.type = "password";
                }
            });
        }

        //load url link
        if (true) {}

        if (s.classList.contains('page-bg-1')) {
            const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
            s.style.minHeight = `${vh}px`;
            console.log(vh)
        }

        if (s.classList.contains('nav-header')) {
            var x = document.querySelector('.nav-header-bottom');
            var wrap = document.querySelector('.content-wrapper');
            var customBottom = document.querySelector('.navbar-customBottom');
            var dataCol = document.querySelector('.data-col');
            var dataCol2 = document.querySelector('.data-col2');
            console.log(s)
            x.style.top = `${s.offsetHeight}px`;
            wrap.style.marginTop = `${s.offsetHeight}px`;
            wrap.style.paddingBottom = `${customBottom.offsetHeight}px`;
        }
        if (s.classList.contains('menu-main')) {
            var x = document.body;
        }
        //look for d-container and  
        if (s.classList.contains('d-container')) {
            var elemChild = s.children;
            //s.classList.contains('navbar-customBottom')
            for (var i = 0; i < elemChild.length; i++) {

                if (elemChild[i].className == "appFooter") {
                    if (document.querySelector('.navbar-customBottom')) {
                         var customBottom = document.querySelector('.navbar-customBottom');
                         elemChild[i].style.paddingBottom = `${customBottom.offsetHeight+10}px`;
                    }   
                     
                }
               
                
            }
            //appFooter
            
        }

        if (s.classList.contains('toggle-score-select')) {
            s.addEventListener('change', function (e) {
                var x = document.querySelectorAll('.anti-score');
                x.forEach(function (tab, i) {
                    tab.classList.remove('active');
                    if (e.target.options.selectedIndex == i) {
                        tab.classList.add('active');
                    }
                })
                //console.log(e.target.options.selectedIndex)
            }) 
        }

        if (s.classList.contains('tab-highlight-wrap')) {
            var tabs =  Array.from(s.children);
            
            var contents = document.querySelectorAll('.event__tabs');
            tabs.forEach(function(tab, index){
                tab.addEventListener('click', function (e) {
                    tabs.forEach(function (tab) {
                        tab.classList.remove('active');
                    });
                    contents.forEach(function (content, i) {
                        
                        if (index == i) {
                            content.classList.add('active');
                        }
                        else{
                            content.classList.remove('active');
                        }
                        
                    })
                    tab.classList.add('active');
                    if (index == 2) {
                        if (activeElem =='') {
                            loadCompanyGames();
                        }
                    }
                    
                }) 
            });
        }

        // go back to previous page
        if (s.classList.contains('page-inner')) {
            s.addEventListener('click', function (e) {
                // go back to previous page
                if (e.target.closest('.go-back__link')) {
                    window.history.go(-1);
                }
            })
        } 

        

        if (s.classList.contains('placebet')) {
            var form = s.querySelector("form");
            form.addEventListener("submit", function (e) {
                e.preventDefault();
                // submit button
                if (e.submitter.closest('.place-bet-btn')) {
                    var betButton = e.submitter.closest('.place-bet-btn');
                    betButton.innerHTML=`Beting..<i class="spinner-border spinner-border-sm"></i>`;
                    $(".iziToast-wrapper").remove();
                    betButton.type = "button";
                    var elements = s.querySelector("form");
                    var formData = new FormData(); 
                    for(var i=0; i<elements.length; i++)
                    {
                        formData.append(elements[i].name, elements[i].value);
                    }
                    var xmlHttp = new XMLHttpRequest();
                    xmlHttp.onreadystatechange = function()
                    {
                        if(xmlHttp.readyState == 4 && xmlHttp.status == 200)

                        {
                            if (xmlHttp.responseText.indexOf('Not Logged in')>=0) {
                                window.location.replace('./signout');
                            }
                            else if (xmlHttp.responseText.indexOf('Token expired')>=0) {
                                window.location.replace('');
                            }
                            else if (xmlHttp.responseText.indexOf('already inplay')>=0) {
                                s.classList.remove('open');
                                document.querySelector('.ubet-modal-1').classList.remove('open');
                                loadGames();
                                betButton.innerHTML=`Place Bet`;
                                betButton.type= "submit";
                            }
                            else if (xmlHttp.responseText.indexOf('Bet Placed')>=0) {
                                s.classList.remove('open');
                                document.querySelector('.ubet-modal-1').classList.remove('open');
                                loadGames();
                                betButton.innerHTML=`Place Bet`;
                                flashMessage('success', `Bet Placed`, 3000);
                            }
                            else{
                                var data = xmlHttp.responseText;
                                var jsonResponse = JSON.parse(data);
                                s.querySelector('input[name="token"]').value=jsonResponse['token'];
                                betButton.innerHTML=`Place Bet`;
                                betButton.type= "submit";

                                flashMessage('success', `${jsonResponse['error']}`, 3000);
                            }


                            
                        }
                    }
                    xmlHttp.open("post", "server-core/place--bet.php"); 
                    xmlHttp.send(formData); 
                    
                }
            })
        }

        // copy data
        if (s.classList.contains('payment_container')) {

            s.addEventListener("click", function (e) {
                $(".iziToast-wrapper").remove();
                if (e.target.closest('.payemnt_wallet_wrapper')) {
                    var x = e.target.closest('.payemnt_wallet_wrapper');
                    for (let i = 0; i < x.children.length; i++) {
                        if (x.children[i].classList.contains("copy")) {
                            if (e.target.closest('.copy')) {
                                var copiedValue = x.children[i].dataset.copy;
                                navigator.clipboard.writeText(x.children[i].dataset.copy);
                                notify("success", `Address copied`);
                            }
                        }
                    }
                }
            });
        }

        //load team


    });//
}); // end of ready function

function interest_value(stakeAmount, percent) {

    stakeAmount = parseFloat(stakeAmount);
    var percent = parseFloat(percent) / 100;

    var interest = (percent * stakeAmount);

    return interest;
}

function countDown(countdown) {
    $(`[data-${countdown}]`).each(function() {
      var $this = $(this), finalDate = $(this).data(`${countdown}`);
      $this.countdown(finalDate, function(event) {
         $this.html(event.strftime('%H:%M:%S'))});
     });
}

function loadGames() {
    var output = '';
    var cont= document.querySelector('.ubet_fixture_wrapper');
    $(".modal_loader").fadeIn(300);
    $.ajax({
        url: "./view/fixtures.php",
        type: "POST",
        data:{page:1},
        dataType:"json"
    }).done(function(response) {
        console.log(response)
        totalPage =response.pagenum;
        $('.userBal').html(response.rebate);
        $('.userBal').attr('data-current-balance', response.rebate);
        response.element.forEach( (data) => {
            if (data.hasOwnProperty('fixture_id')) {
                output += events(data);
            }
            else{
                //output = emptyPage();
            }
        })
        stopScroll = 1;
        cont.innerHTML = output;
        $(".modal_loader").fadeOut(300);
    });
}

function notify(status, message) {
    if (typeof message == "string") {
        iziToast[status]({
            message: message,
            position: "topLeft",
        });
    } else {
        $.each(message, function (i, val) {
            iziToast[status]({
                message: val,
                position: "topLeft",
            });
        });
    }
}


function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}


function deletCookie(cname) {
    if (checkCookie(cname)) {
        document.cookie = cname + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
}

function checkCookie(string) {
    let str = string.split('.').join("");
    return (getCookie(`${string}`)) ? true : false;
}

function inputCookie(string) {
    var str = string.split('.').join("");
    if (getCookie(str)) {
        return true;
    }
    else{
        return false;
    }
}

function addInput(inputName) {
  return ($('input[name="'+inputName+'"]').length > 0)? true : false;
}

function checkString(string) {
    //var format = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
    var format = /[ `!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/;
    return format.test(string);
}



function GtToggleElement(element, cl_name) {
    const p = document.querySelector(`${element}`);
    for (let i = 0; i < p.children.length; i++) {
        p.children[i].classList.remove('active');
        if (p.children[i].classList.contains(`${cl_name}`)) {
            p.children[i].classList.add('active');
        }
        
    }
}

function showPayemntDetails(element, cl_name, arr) {
    const p = document.querySelector(`${element}`);
    if (cl_name == 'show') {
        paymentTemplate(p, arr);
    }
    else if (cl_name == 'hide') {
        paymentTemplate2(p);
    }
    else{
        paymentTemplate2(p);
    }
}

function clearInput(elements) {
    for (var ii=0; ii < elements.length; ii++) {
      if (elements[ii].type == "text") {
        elements[ii].value = "";
      }
    }
}

function toggle_options(b, prevElem, element) {
    element.forEach((d)=>{
        d.classList.remove('active');
    });

    var name = b.querySelector('.coinName');

    var selectedImg = prevElem.querySelector('.crypto-icosn');
    var selectedName = prevElem.querySelector('.selected');


    b.parentElement.parentElement.classList.add('no-before');
    b.parentElement.style.maxHeight = `0px`;

    if (b.querySelector('.crypto-icon-2')) {
        var img = b.querySelector('.crypto-icon-2');
        selectedImg.dataset.cryptoIcon = img.dataset.cryptoIcon;
        selectedImg.srcset = img.dataset.cryptoIcon;
    }

    if (selectedName.hasAttribute("data-id")) {
        selectedName.dataset.id = name.dataset.id;
    }

    selectedName.dataset.coin = name.dataset.coin;
    selectedName.textContent = name.dataset.coin;
    b.classList.add('active');

}

function flashMessage(type, msg, time="") {
    var body = document.body;
    const alertWrap = document.createElement("div");
    const alert = document.createElement("div");
    const closebtn = document.createElement("span");
    const textNode = document.createTextNode(`${msg}`);
    alertWrap.className ="alert-wrap";
    alert.className =`alert ${type}`;
    closebtn.className ="closebtn";
    
    closebtn.innerHTML = `&times;`;
    alert.appendChild(closebtn);
    alert.appendChild(textNode);
    alertWrap.appendChild(alert);


    body.appendChild(alertWrap);
    $( ".alert-wrap" ).animate({
        top: `20%`
    });
    closebtn.addEventListener('click', (e)=> {
        removeAnimation(alertWrap)
    })
    time = parseInt(time) || 0;
    /*setTimeout(()=>{
        removeAnimation(alertWrap);
    }, 5000);*/
    
}

function removeAnimation(elem) {
    $( ".alert-wrap" ).animate({
        top: `-20%`
    },function() {
        elem.remove();
    });
}
function faedIn(elem) {
    var elementattr = Number(getComputedStyle(elem).opacity);
    if (elementattr >= 1) {
        return;
    }
    elem.style.opacity = elementattr + 0.01;
    setTimeout(function () {
        faedIn(elem);
    }, 10);
}
function faedOut(elem) {
    if (elem !== null) {
        var elementattr = Number(getComputedStyle(elem).opacity);
        if (elementattr <= 0) {
            if (elem) {
                elem.remove();
                //elem.removeChild(elem)
            }
            return;
        }
        elem.style.opacity = elementattr - 0.01;
        setTimeout(function () {
            faedOut(elem);
        }, 10);
    }
    
}

function loadCompanyGames() {
    $(".modal_loader").fadeIn(300);
    $.ajax({
        url: "server-core/set-services.php",
        type: "POST",
        data:{companyGame:12356}
    }).done(function(response) {
        activeElem = 1;
        $('.company_games').html(response);
        $(".modal_loader").fadeOut(300);

        $('[data-countdown]').each(function() {
          var $this = $(this), finalDate = $(this).data('countdown');
          $this.countdown(finalDate, function(event) {
            $this.html('Ends in ' + event.strftime('%H:%M:%S'))
          });
        });
    });
    
}



function formatDate(d) {
    return (d < 10) ? '0'+d : d;
}

function todayDate() {
    var today = new Date();
    var d = String(today.getDate()).padStart(2, '0');
    var m = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var y = today.getFullYear();
    today = m + '/' + d + '/' + y;
    return today;
}
function today_date_time() {
    var today = new Date();
    var d = String(today.getDate()).padStart(2, '0');
    var m = String(today.getMonth() + 1).padStart(2, '0');
    var h = String(today.getHours()).padStart(2, '0');
    var min = String(today.getMinutes()).padStart(2, '0');
    var s = String(today.getSeconds()).padStart(2, '0');
    var y = today.getFullYear();
    today = m + '/' + d + '/' + y + ' ' + h +':'+ min + ':' + s;
    return today;
}



function create_table_list(team, arTh) {
        const div = document.createElement("div");
        var tbl = document.createElement('table');
        div.setAttribute('class', 'table-container');
        tbl.setAttribute('class', 'resp-table table-striped');
        var thead = document.createElement('thead');
        var tbody = document.createElement('tbody');
        tbody.setAttribute('class', 'clientData');

        for (var i = 0; i < arTh.length; i++) {
            var th = document.createElement('th');
            th.setAttribute('class', 'head');
            th.appendChild(document.createTextNode(`${arTh[i]}`));
            thead.appendChild(th);
        }
        tbl.appendChild(thead);
        tbl.appendChild(tbody);
        div.appendChild(tbl);
        team.appendChild(div);
}

function countdown(codeBtn){
   $('[data-countdown]').each(function() {
      var $this = $(this), finalDate = $(this).data('countdown');
      $this.countdown(finalDate, function(event) {
        $this.html(event.strftime('Resend in %M:%S'))}).on('finish.countdown', function() {
            codeBtn.textContent ='Send code';
            codeBtn.classList.remove('no-email');
        });
    });
};

function stop_countdown(codeBtn){
   $('[data-countdown]').each(function() {
      var $this = $(this), finalDate = $(this).data('countdown');
      console.log($this.countdown('stop'));
      $this.html('Send code');
    });

};

function countdownTimer(codeBtn){
   $('[data-countdown]').each(function() {
      var $this = $(this), finalDate = $(this).data('countdown');
      $this.countdown(finalDate, function(event) {
        $this.html(event.strftime('Resend in %M:%S'))}).on('finish.countdown', function() {
            codeBtn.textContent ='Resend';
            codeBtn.classList.remove('no-email');
        });

        $this.countdown('start');
    });
  };

function events(data) {
    var x = `<div class="features-list">
                <input type="hidden" name="fixture_id" data-fixture_id="${data.fixture_id}">
                <input type="hidden" name="api_key" data-api_key="${data.api_key}">
                <input type="hidden" name="scores" data-scores='${data.label}'>
                <input type="hidden" name="percent" data-percent='${data.proba}'>
                <input type="hidden" name="under_over" data-under-over='${data.ou}'>
                <input type="hidden" name="uo_odds" data-uo-odds='${data.odd}'>
                <div class="f-bottom">
                    <div class="league-datails" data-league="${data.league}" data-country="${data.country}">
                        <span>${data.country} - ${data.league}</span>
                    </div>
                </div>
                <div class="features-head-details">
                    <div class="match-schedule">
                        <span class="date_time" data-event_date="${data.date_time}">${data.date_time}</span>
                    </div>
                </div>
                <div class="features-teams d-flex">
                    <div class="ubet-teams">
                        <div class="team-logo-wrap d-flex">
                            <div class="team-logo home-logo" data-home_logo="${data.home_logo_path}"/>
                                <img src="${data.home_logo_path}" alt="logo">
                            </div>
                        </div>
                        <div class="team-name home-team-name" data-home_team="${data.home_team}">${data.home_team}</div>
                    </div>
                    <span class="seperator">Vs</span>
                    <div class="ubet-teams">
                        <div class="team-logo-wrap d-flex">
                            <div class="team-logo away-logo" data-away_logo="${data.away_logo_path}">
                                <img src="${data.away_logo_path}" alt="logo" />
                            </div>
                        </div>
                        <div class="team-name away-team-name" data-away_team="${data.away_team}">${data.away_team}</div>
                    </div>
                </div>
                <div class="f-bottom"></div>
            </div>`;
    return x;
}

function apiPicker() {
    var flickerAPI = "https://api.db-ip.com/v2/free/self";
        $.getJSON( flickerAPI, {
        tags: "mount rainier",
        tagmode: "any",
        format: "json"
    })
    .done(function( data ) {
        var jsonStr = JSON.stringify(data);  // THE OBJECT STRINGIFIED

    });
}

function passDisplay(userInput) {
    let emptyStr = "";
    if (userInput) {
        emptyStr = userInput.substring(0, 4);
        if (userInput.length > 3) {
           emptyStr += Array(userInput.length - 4).fill('*').join('');
        }
    }
    return emptyStr;
}
function shortenChar(char, leng) {
     return char.slice(0, leng)+'*****';
}

