
var clientGuid
var clientEmail

// $.ajax({}) //REMEMBER !! when its present = default async:true 

// GLOBAL PATH TO HANDLER
var pathToHandler = "/CometAsyncHandler.ashx";

var gameName
var gameId
var scoreForQuestion
var selectedAnswer
var answerList = new Array();
var gameStart = false;
var trueCls = ["tada", "rubberBand", "pulse", "flash"];  //animation if true
var falseCls = ["hinge", "shake", "swing", "wobble"];   // animation if false

// When every window opens - its connecting
$(document).ready(function () {
    var str = window.location.href;
    if (str.indexOf("?") < 0)
        Connect();
});
// When every window close - its disconnecting
$(window).unload(function () {
    var str = window.location.href;
    if (str.indexOf("?") < 0)
        Disconnect();
});


function Connect() {
    commandObj = {
        "command": "CONNECT",
        "userinfo": "userinfo"
    };
    jsonObject = JSON.stringify(commandObj);
    $.ajax({
        type: "POST",
        url: pathToHandler,
        data: jsonObject,
        success: OnConnected,
        error: ConnectionRefused
    });
}

function Disconnect() {
    commandObj = {
        "command": "DISCONNECT",
        "userinfo": "userinfo"
    };
    jsonObject = JSON.stringify(commandObj);
    $.ajax({
        type: "POST",
        url: pathToHandler,
        data: jsonObject
    });
}

function OnConnected(result) {
    clientGuid = result;
    SendRequest();
}

// every time sends request to detect changes on the page ( if its new Client GUID)
function SendRequest() {
    commandObj = {
        "command": "CLIENTGUID",
        "ClientID": clientGuid
    };
    jsonObject = JSON.stringify(commandObj);
    $.ajax({
        type: "POST",
        url: pathToHandler,
        data: jsonObject,
        success: ProcessResponse,
        error: SendRequest
    });
}

// loop SendRequest to detect new Cliend GUID
function ProcessResponse(result) {
    $("#contentWrapper").html(result);
    SendRequest();
}

function ConnectionRefused() {
    $("#contentWrapper").html("Unable to connect to Comet server. Reconnecting in 5 seconds...");
    setTimeout(Connect(), 5000);
}



function getFreshUserInfo(clientEmail) {
    var commandObj = { "command": "getUserInfo", "userinfo": clientEmail };
    jsonObject = JSON.stringify(commandObj);
    $.ajax({
        type: 'POST',
        url: pathToHandler,
        data: jsonObject,
        responseType: 'json',
        success: onSuccess,
        error: getFreshUserInfo
    });
}

function getGames() {
    commandObj = {
        "command": "getGames",
        "daaaaaaada": "fddddafa"
    };
    jsonObject = JSON.stringify(commandObj);
    $.ajax({
        async: true,
        type: 'POST',
        url: pathToHandler,
        data: jsonObject,
        responseType: 'json',
        success: onSuccess,
        error: getGames
    }).done(startGame);

}

function startGame() {
    $('.pic').click(function () {
        gameName = $(this).attr('name');
        gameId = $(this).attr('id');
        $.ajax({
            async: true,
            type: 'POST',
            url: pathToHandler,
            data: '{"categoryId":"' + gameId + '" , "command": "startGame"}',
            success: continueGame,
            error: startGame
        });
    });
}

//Fetch next question - if it wasn't last 
function continueGame(trueOrFalse, score) {
    $(".alert").empty();
    $.ajax({
        async: true,
        type: 'POST',
        url: pathToHandler,
        data: '{"gameAction":"' + trueOrFalse + '", "command": "continueGame","score": "' + score + '"}',
        success: onSuccess,
        error: continueGame
    });
}


function httpSendFormJSON(event) {
    $.ajax({
        async: true,
        type: 'POST',
        //  contentType: "application/json; charset=utf-8",
        url: pathToHandler,
        //  dataType: "json",
        data: getRawJson(this),   // jsonData,    //  JSON.stringify($(this).serializeArray()),     // JSON.stringify($(this).serializeArray()),
        success: onSuccess,
        error: httpSendFormJSON
    });
    event.preventDefault();
}

function getRawJson(form) {
    return JSON.stringify($(form).serializeArray().reduce(function (a, x) {
        a[x.name] = x.value;
        return a;
    }, {}));
}

function onSuccess(data) {
    var alertOriginalState = $(".alert").clone();
    var result = JSON.parse(data);
    // console.log(data);
    switch (result.status) {
        case 100:  // login ok
            alert(result.message);
            break;

        case 404: // user not found
            alert(result.message);
            break;

        case 406: // registraion failed
            $("#alert").append(result.message)
            $(".alert").fadeIn(1000, function () {
                $(this).click(function () {
                    $(".alert").replaceWith(alertOriginalState);
                });
            });
            break;

        case 405: // registraion failed - email allready presents
            $("#alert").append(result.message)
            $(".alert").fadeIn(1000, function () {
                $(this).click(function () {
                    $(".alert").replaceWith(alertOriginalState);
                });
            });
            break;

        case 200: // load games
            console.log(result.listData);
            $.each(result.listData, function (index, game) {
                $('#game').append('\n\
                 <div class="section current col-xs-6 col-sm-4 text-center"><br>\n\
                 <h2>' + game.category_name + '</h2><br<br>\n\
                \n\<div id=" ' + game.category_game + ' " class="categg bejaviy">\n\
                <a href="#ready" data-transition="flip" data-rel="popup" data-position-to="window">\n\
               <img  name="' + game.category_name + '" src ="/Content/img/' + game.picture + '" id="' + game.id + '" class ="pic rotated" style="cursor: pointer;" >\n\
                </a></div>\n\<br><br><br></div>');
            });
            break;

        case 1000: // logout
            $("#alert").append("<br/>" + result.message)
            $(".alert").fadeIn(1000, function () {
                $(this).click(function () {
                    location.href = 'Home.aspx';
                });
            });
            break;
        case 10: // continue game
            console.log(result);
            gameStart = true;
            answerList = new Array();
            $('#gamesList').hide();
            $('#navbar').hide();
            $('#gameContent').fadeIn(2000);
            $('#questionContent').empty();
            $('#questionContent').fadeIn(2000);
            $('#questionNumber').empty();
            $('#questionPoints').empty();
            $('#answerContent').empty();
            $('#gameName').empty();
            $('#questionNumber').append(result.message);
            $('#questionPoints').append(result.objData.points);
            scoreForQuestion = result.objData.points;
            $('#gameName').append(gameName);

            if (result.objData.question_type == 'close') {
                $('#questionContent').append('<h2 style="text-align:center">' + result.objData.question + '</h2>')
                if (result.objData.image != null) {
                    $('#questionContent').append('</div>').css({ 'text-align': 'center' })
                        .append($('<img/>', { class: 'pic questionImg', src: '/Content/img/game/' + result.objData.image + '' }));

                }
                $.each(result.listData, function (index, ans) {
                    indexId = 0;
                    $('#answerContent').append(
                        $('<div/>', { class: 'categg', id: 'closeAnsDiv' })
                        .append(
                        $('<button />', { id: index, class: 'questionBtn animated' })
                        .text(ans.answer)
                        .css({ 'cursor': 'pointer', 'width': '100%', 'height': '100%' })
                    ));
                    answerList.push(ans);
                });
            }

            else if (result.objData.question_type == 'open') {
                $('#questionContent').append(
                    $('<div/>', { class: 'categg', id: 'openAnsDiv' })
                    .css({ 'text-align': 'center' }).append(
                    $('<h2/>').text(result.objData.question)).append(
                    $('<img/>', { class: 'pic questionImg', src: '/Content/img/game/' + result.objData.image + '' }), $('<br/>')).append(
                    $('<input/>', { placeholder: 'Write answer..', type: 'search', id: 'textAnswer' })
                    .css({}))
                    );
                console.log(result.listData);
                $.each(result.listData, function (index, ans) {
                    answerList.push(ans);
                })
            }
            break;

        case 20: // if game ends 
            $('.alert')
                .append('<div style="padding: 1%;padding-bottom:1%;margin-left:2%;">\n\
                Right answered </br>' + result.objData.number_right_questions + '<br>\n\
                        Score for this Game </br>' + result.objData.score + '</div>')
                .css({ 'background-color': 'rgba(151, 129, 125, 1)', 'font-size': '18px' })
            $(".alert").fadeIn(1000, function () {
                $(this).click(function () {
                    $('#gameContent').addClass('animated zoomOut').on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend',
                              function () { // removing animation when its end
                                  $('.alert').replaceWith(alertOriginalState);
                                  $('#gameContent').removeClass('animated zoomOut');
                                  $('#gamesList').show(1000);
                                  $('#navbar').show(1000);
                              }
                               );
                });
            });
            break;

        case 30:
            // and then fetch all player info for Profile Page 
            var UserInfo = '';
            $.each(result.userData, function (i, row) {
                UserInfo += '<tr>\n\
                           <td>' + row.Picture + '</td>\n\
                           <td>' + row.Username + '</td>\n\
                           <td>' + row.Email + '</td>\n\
                           <td>' + row.Registration_Date + '</td>\n\
                           <td>' + row.TotalGames + '</td>\n\
                           <td>' + row.AverageScore + '</td>\n\
                           <td>' + row.TotalGames + '</td>\n\
                           <td>' + row.Place + '</td>\n\
                          </tr>';
            });

            $('#user-info-table').find('tbody > tr').empty();
            $('#user-info-table').append(UserInfo);

            var gamesTable = '';
            $.each(result.userGamesData, function (i, row) {
                gamesTable += '<tr>\n\
                           <td>' + row.Game + '</td>\n\
                           <td>' + row.Score + '</td>\n\
                           <td>' + myDateFormat(row.DatePlayer) + '</td>\n\
                           <td>' + row.Questions + '</td>\n\
                          </tr>';
            });
            $('#games-results-table').find('tbody > tr').empty();
            $('#games-results-table').append(gamesTable);
            break;

        default:
            alert("default");
    }
}

//CHECK CLOSE QUESTION
$(document).on('click', '#closeAnsDiv .questionBtn', function () {
    $("#answerContent :button").attr("disabled", true);
    var clickedButton = $(this);
    var randomAnim = "";
    //  alert(clickedButton.text() + ' ' + clickedButton.attr('id'));
    $.each(answerList, function (index, ans) {
        if (index == clickedButton.attr('id')) {
            if (ans.is_right == true) {
                randomAnim = trueCls[~~(Math.random() * trueCls.length)];
                clickedButton.addClass(randomAnim)
                clickedButton.on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend',
                   function () { // removing animation when its end
                       //    var lastClass = clickedButton.attr('class').split(' ').pop();
                       console.log(randomAnim);
                       clickedButton.removeClass(randomAnim);
                       $(".alert").append("<p/>").css({ 'background-color': 'rgba(184, 218, 44, 0.9)', 'color': 'white', 'font-size': '26px' }).text('Right!');
                       $(".alert").fadeIn(700, function () {
                           $(this).delay(800);
                           $(this).fadeOut(500, function () {
                               continueGame(true, scoreForQuestion)
                           });
                       });
                   }
                    );
            }
            else if (ans.is_right == false) {
                randomAnim = falseCls[~~(Math.random() * falseCls.length)];
                clickedButton.addClass(randomAnim)
                clickedButton.on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend',
                    function () { // removing animation when its end
                        //     var lastClass = clickedButton.attr('class').split(' ').pop();
                        console.log(randomAnim);
                        clickedButton.removeClass(randomAnim);
                        $(".alert").append("<p/>").css({ 'background-color': 'rgba(255, 0, 0, 0.4)', 'color': 'white', 'font-size': '26px' }).text('Wrong!');
                        $(".alert").fadeIn(700, function () {
                            $(this).delay(800);
                            $(this).fadeOut(500, function () {
                                continueGame(true, 0)
                            });
                        });
                    }
                    );
            }
        }
    });

});

//CHECK OPEN QUESTION
$(document).keypress(function (e) {
    var answersArr = new Array();
    if (e.which == 13 && $('#textAnswer').val()) { // if not empty and pressed enter
        var enteredText = $('#textAnswer').val().toLowerCase();
        $.each(answerList, function (index, ans) {
            var ansStr = ans.answer.toLowerCase();
            answersArr = ansStr.split(/ +/); // var array = string.split(' ');
        });
        var found = $.inArray(enteredText, answersArr) > -1;
        if (found) {
            $(".alert").append("<p/>").css({ 'background-color': 'rgba(184, 218, 44, 0.9)', 'color': 'white', 'font-size': '26px' }).text('Right!');
            $(".alert").fadeIn(700, function () {
                $(this).delay(800);
                $(this).fadeOut(500, function () {
                    continueGame(true, scoreForQuestion)
                });
            });
        }
        else {
            $(".alert").append("<p/>").css({ 'background-color': 'rgba(255, 0, 0, 0.4)', 'color': 'white', 'font-size': '26px' }).text('Wrong !');
            $(".alert").fadeIn(700, function () {
                $(this).delay(800);
                $(this).fadeOut(500, function () {
                    continueGame(true, scoreForQuestion)
                });
            });
        }
    }
});


$(document).on('click', '.alert .alert', function () {
    $('.alert').addClass('animated zoomOut').on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend',
                   function () { // removing animation when its end
                       $('.alert').removeClass('animated zoomOut');
                   }
                    );
})

function myDateFormat(date) {
    newDate = new Date(date);
    year = "" + newDate.getFullYear();
    month = "" + (newDate.getMonth() + 1); if (month.length == 1) { month = "0" + month; }
    day = "" + newDate.getDate(); if (day.length == 1) { day = "0" + day; }
    hour = "" + newDate.getHours(); if (hour.length == 1) { hour = "0" + hour; }
    minute = "" + newDate.getMinutes(); if (minute.length == 1) { minute = "0" + minute; }
    second = "" + newDate.getSeconds(); if (second.length == 1) { second = "0" + second; }
    return year + "/" + month + "/" + day + "  " + hour + ":" + minute + ":" + second;
}







