// when first load the app
function initialize() {
    // initialize all global veriables
    localStorage.setItem("fontSize", "fs-6");
    localStorage.setItem("degreeUnit", "°C");
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches){
        localStorage.setItem("mode", "light");
    } else {
        localStorage.setItem("mode", "dark");
    }

    let lang;
    if (navigator.language.includes("-")){
        lang = navigator.language.split("-")[0]
    } else { lang = navigator.language;}
    localStorage.setItem("language", lang);

    let status = "* Offline *";
    if (navigator.onLine) {
        status = "* Online *";
        splashScreen()
        setTimeout(loadData = () => {
            getCurrentLocation()
            // initialize font size, language and mode
            changeFontSize(localStorage.getItem("fontSize"));
            changeMode();
            changeUnit(localStorage.getItem("degreeUnit"));
            changeLanguage(localStorage.getItem("language"));
        }, 3000)
    } else { // in cordova handle
    }
}

// Splash Screen
function splashScreen(){
    document.getElementById("splash-screen").hidden = false;
    document.getElementById("currentWeather").hidden = true;
    document.querySelector(".progress-bar").animate({
        width: "100%"
    }, 3300);
    setTimeout(closeSplash = () => {
        document.getElementById("splash-screen").hidden = true;
        document.getElementById("currentWeather").hidden = false;
        document.getElementById("navbar").classList.remove("d-none");
        document.getElementById("footer").classList.remove("d-none");
    }, 3000)
}

// get location
function getCurrentLocation(){
    if (navigator.geolocation){
        navigator.geolocation.getCurrentPosition(getposition = (position) => {
            localStorage.setItem("lat", position.coords.latitude);
            localStorage.setItem("lon", position.coords.longitude);
            retrieveData();
        }, error => {
            console.log("Location permission is not allowed.");
            // change to user prompt
        });
    } else {
        //Geolocation API not supported 
        // change to user prompt
    }
}

function retrieveData() {
    // Get the data here
    if (localStorage.getItem("lat") != null || localStorage.getItem("lan") != null){
        const xhr = new XMLHttpRequest();
        let weather_url = "https://api.open-meteo.com/v1/forecast?current=temperature_2m,relative_humidity_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FSingapore";
        if (localStorage.getItem("degreeUnit") == "°F"){
            weather_url += "&temperature_unit=fahrenheit";
        }
        weather_url = weather_url + "&latitude=" + localStorage.getItem("lat") + "&longitude=" + localStorage.getItem("lon");
        xhr.open("get", weather_url);
        xhr.send();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                let data = JSON.parse(xhr.response);
                displaydata(data);
            }
        };
        
        const xhr2 = new XMLHttpRequest();
        let placeURL = "https://api.openweathermap.org/geo/1.0/reverse?lat=" + localStorage.getItem("lat") + "&lon=" + localStorage.getItem("lon") + "&appid=863d435cfa4c49f5a3175f6015ca9a60";
        // 13c6cd687cf7dd3b7dcf27a1dc53afe9
        xhr2.open("get", placeURL);
        xhr2.send();
        xhr2.onreadystatechange = function () {
            if (xhr2.readyState === 4) {
                let placedata = JSON.parse(xhr2.response);
                displaydataPlace(placedata);
            }
        }
    }
}

// show the place name
function displaydataPlace(placedata){
    let templang = localStorage.getItem("language");
    document.getElementById("place").innerHTML = placedata[0].local_names[templang];
}
// show the data forecast
function displaydataForecast(i, data){
    let tempcontent = '<div class="row py-1"><div class="col-8">';
    tempcontent += '<div>' + data.daily.time[i] + '</div>';
    tempcontent += '<div>' + data.daily.temperature_2m_min[i].toFixed() + " - " + data.daily.temperature_2m_max[i].toFixed() + data.daily_units.temperature_2m_max + '</div>';
    tempcontent += '</div><div class="col-4">';
    tempcontent += '<img src="' + imgSource(data.daily.weather_code[i]) + '" class="weatherImg" width="50" height="50"></img>';
    tempcontent += '</div></div>';
    return tempcontent;
}

// show the forecast graph line chart
function displayforecastgraphic(data, chartid){
    var date = new Array();
    for (let j = 0; j < data.daily.time.length; j++){
        date[j] = data.daily.time[j].substr(5,data.daily.time[j].length);
    };
    var lang = localStorage.getItem("language");

    var maxTemp = langData[lang].MaxTemp;
    var minTemp = langData[lang].MinTemp;
    var temp = langData[lang].Temperature;
    var datetran = langData[lang].Date;

    let chartStatus = Chart.getChart(chartid);
    if (chartStatus != undefined) {
        chartStatus.destroy();
    }
    
    let chart = document.getElementById(chartid);
    if (localStorage.getItem("fontSize") == "fs-6"){
        Chart.defaults.font.size = 16;
    } else if (localStorage.getItem("fontSize") == "fs-4"){
        Chart.defaults.font.size = 18;
    } else {
        Chart.defaults.font.size = 20;
    }

    let linechart = new Chart(chart, {
        type: "line",
        data: {
            labels: date,
            datasets: [{ 
                label: maxTemp,
                data: data.daily.temperature_2m_max,
                borderColor: "#ff9393",
                fill: false
            }, { 
                label: minTemp,
                data: data.daily.temperature_2m_min,
                borderColor: "#3ecdff",
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: datetran + " (" + data.daily.time[0].substr(0, data.daily.time[0].search("-")) + ")"
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: temp + " (" + data.daily_units.temperature_2m_max + ")"
                    }
                }
            }
            
        }
    });
}

function displaydata(data) {
    // show the current temp
    document.getElementById("temp").innerHTML = data.current.temperature_2m + data.current_units.temperature_2m;
    document.getElementById("humidity").innerHTML = data.current.relative_humidity_2m;

    // show the weather pic
    let weatherCode = parseInt(data.current.weather_code);
    document.getElementById("currentweatherImg").src = imgSource(weatherCode);
    
    // show the update date and time
    let datatime = data.current.time.replace("T", " ");
    document.getElementById("updateTime").innerHTML = datatime;

    // show forecast data
    let tempcontent = "";
    for (let i = 0; i < data.daily.time.length; i++){
        tempcontent += displaydataForecast(i, data)
        if (i != data.daily.time.length-1){
            tempcontent += "<hr>"
        }
    }
    document.getElementById("forecast").innerHTML = tempcontent;

    // show the graphic
    displayforecastgraphic(data, "forecastChart");
}

// get the img source
function imgSource(weatherCode){
    let tempweather;
    if (weatherCode == 0){
        tempweather = "clear";
    } else if (weatherCode <= 3){
        tempweather = "cloudy";
    } else if (weatherCode >= 40 && weatherCode <= 49){
        tempweather = "fog";
    } else if (weatherCode >= 50 && weatherCode <= 59){
        tempweather = "drizzle";
    } else if ((weatherCode >= 60 && weatherCode <= 69) || (weatherCode >= 80 && weatherCode <= 82) || (weatherCode >= 91 && weatherCode <= 92)){
        tempweather = "rain";
    } else if ((weatherCode >= 70 && weatherCode <= 79) || (weatherCode >= 83 && weatherCode <= 90) || (weatherCode >= 93 && weatherCode <= 94)){
        tempweather = "snow";
    } else if (weatherCode >= 95){
        tempweather = "thunderstorm";
    }
    return "img/weather/" + tempweather + "_" + localStorage.getItem("mode") + ".png";
}

// change the light mode and dark mode
function changeMode(){
    var mode = localStorage.getItem("mode");
    if (mode == "light"){
        localStorage.setItem("mode", "dark");
        document.getElementById("mode").src = "img/sun.png";
        document.getElementsByTagName("html")[0].setAttribute("data-bs-theme", "dark");
        document.getElementsByTagName("nav")[0].classList.remove("bg-dark-subtle");
        document.getElementsByTagName("nav")[0].classList.add("bg-light-subtle");
        document.getElementsByTagName("nav")[1].classList.remove("bg-dark-subtle");
        document.getElementsByTagName("nav")[1].classList.add("bg-light-subtle");
        document.getElementById("refresh").src = "img/refresh_white.png";
        document.getElementById("refresh_other").src = "img/refresh_white.png";
        bg = document.getElementsByClassName("BG");
        for (let i = 0; i < bg.length; i++){
            bg[i].style.backgroundColor = "#FFFFFF20";
        }
        document.getElementById("refreshButton").classList.remove("btn-outline-dark");
        document.getElementById("refreshButton").classList.add("btn-outline-light");
        document.getElementById("refreshButton_other").classList.remove("btn-outline-dark");
        document.getElementById("refreshButton_other").classList.add("btn-outline-light");
        document.querySelector("#DarkMode").textContent = langData[localStorage.getItem("language")].LightMode;
        document.getElementById("logo").src = "img/logo_dark.png";
    }else{
        localStorage.setItem("mode", "light");
        document.getElementById("mode").src = "img/moon.png";
        document.getElementsByTagName("html")[0].setAttribute("data-bs-theme", "light");
        document.getElementsByTagName("nav")[0].classList.remove("bg-light-subtle");
        document.getElementsByTagName("nav")[0].classList.add("bg-dark-subtle");
        document.getElementsByTagName("nav")[1].classList.remove("bg-light-subtle");
        document.getElementsByTagName("nav")[1].classList.add("bg-dark-subtle");
        document.getElementById("refresh").src = "img/refresh_black.png";
        document.getElementById("refresh_other").src = "img/refresh_black.png";
        bg = document.getElementsByClassName("BG");
        for (let i = 0; i < bg.length; i++){
            bg[i].style.backgroundColor = "#00000010";
        }
        document.getElementById("refreshButton").classList.remove("btn-outline-light");
        document.getElementById("refreshButton").classList.add("btn-outline-dark");
        document.getElementById("refreshButton_other").classList.remove("btn-outline-light");
        document.getElementById("refreshButton_other").classList.add("btn-outline-dark");
        document.querySelector("#DarkMode").textContent = langData[localStorage.getItem("language")].DarkMode;
        document.getElementById("logo").src = "img/logo_light.png";
    }
    // change all weather img
    let wImgs = document.querySelectorAll(".weatherImg");
    for (let i = 0; i < wImgs.length; i++){
        tempSrc = wImgs[i].src.split("/").pop().split(".")[0].split("_")[0];
        if (tempSrc != ""){
                    tempSrc = "img/weather/" + tempSrc + "_" + localStorage.getItem("mode") + ".png";
            wImgs[i].src = tempSrc;
        }
    }
}

// change the font size
function changeFontSize(size){
    const html = document.getElementsByTagName("html")[0];
    const currentSize = document.getElementsByTagName("html")[0].classList[0];
    if (currentSize != ""){
        document.getElementsByTagName("html")[0].classList.remove(currentSize);
    };
    document.getElementsByTagName("html")[0].classList.add(size);
    localStorage.setItem("fontSize", size);
    retrieveData();
}

// change the degree unit
function changeUnit(unit){
    localStorage.setItem("degreeUnit", unit);
    document.getElementById("currentTempUnit").textContent = localStorage.getItem("degreeUnit");
}

// refresh data
function refreshData(param = "other"){
    retrieveData();
    if (param == "click"){
        loader();
    }
}

// language data
const langData = {
    "en": 
    {
        "Setting": "Setting",
        "FontSize": "Font size",
        "Text": "Text",
        "Language": "Language",
        "UpdateAt": "Updated at",
        "CurrentLocationWeather": "Current location weather",
        "WeatherForcast": "Weather forcast",
        "Refresh": "Refresh",
        "MaxTemp": "Maximum temperature",
        "MinTemp": "Minimum temperature",
        "GraphicalVersion": "Graphical version",
        "Temperature": "Temperature",
        "Date": "Date",
        "Appearance": "Appearance",
        "DarkMode": "Dark Mode",
        "LightMode": "Light mode",
        "currentLang": "en",
        "TempUnit": "Temperature unit",
        "COLW": "Check other location weather",
        "ICH": "Input city here",
        "CityNotFound": "City not found. Please input other city!",
        "Copyright": "Copyright © 2024 13481443, 13481455.<br>All rights reserved."
    },
    "zh": 
    {
        "Setting": "設定",
        "FontSize": "字體大小",
        "Text": "文字",
        "Language": "語言",
        "UpdateAt": "更新於",
        "CurrentLocationWeather": "本地天氣",
        "WeatherForcast": "天氣預報",
        "Refresh": "重新整理",
        "MaxTemp": "最高溫度",
        "MinTemp": "最低溫度",
        "GraphicalVersion": "圖表版",
        "Temperature": "溫度",
        "Date": "日期",
        "Appearance": "外觀",
        "DarkMode": "深色模式",
        "LightMode": "淺色模式",
        "currentLang": "中文",
        "TempUnit": "溫度單位",
        "COLW": "查看其他地區天氣",
        "ICH": "輸入城市",
        "CityNotFound": "未找到城市。請輸入其他城市！",
        "Copyright": "版權所有 © 2024 13481443, 13481455"
    },
    "ko": 
    {
        "Setting": "설정",
        "FontSize": "글꼴 크기",
        "Text": "문자",
        "Language": "언어",
        "UpdateAt": "에서 갱신된",
        "CurrentLocationWeather": "현지 날씨",
        "WeatherForcast": "일기 예보",
        "Refresh": "새로 고치다",
        "MaxTemp": "최고 온도",
        "MinTemp": "최저 온도",
        "GraphicalVersion": "그래픽 버전",
        "Temperature": "온도",
        "Date": "날짜",
        "Appearance": "모양",
        "DarkMode": "다크 패턴",
        "LightMode": "멜란지 패턴",
        "currentLang": "한국어",
        "TempUnit": "온도의 단위",
        "COLW": "다른 지역 날씨 살펴보기",
        "ICH": "수입 도시",
        "CityNotFound": "도시를 찾을 수 없습니다. 다른 도시를 입력하십시오!",
        "Copyright": "판권소유 © 2024 13481443, 13481455"
    }
}


// To change the language of the application
function changeLanguage(lang){
    if (lang.includes("-")){
        lang = lang.split("-")[0]
    }
    localStorage.setItem("language", lang);

    // nav bar, footer
    const textCLW = document.querySelector(".CurrentLocationWeather");
    textCLW.textContent = langData[lang].CurrentLocationWeather;
    const footerLang = document.querySelector(".Copyright");
    footerLang.innerHTML = langData[lang].Copyright;

    // other location
    const colwLang = document.querySelectorAll(".COLW");
    for (let i = 0; i < colwLang.length; i++) {
        colwLang[i].textContent = langData[lang].COLW;
    }
    const ichLang = document.querySelector(".ICH");
    ichLang.textContent = langData[lang].ICH;

    const cityAlertLang = document.querySelector(".CityNotFound");
    cityAlertLang.textContent = langData[lang].CityNotFound;

    // main page
    const textUA = document.querySelectorAll(".UpdateAt");
    for (let i = 0; i < textUA.length; i++) {
        textUA[i].textContent = langData[lang].UpdateAt;
    }
    const wfLang = document.querySelectorAll(".WeatherForcast");
    for (let i = 0; i < wfLang.length; i++) {
        wfLang[i].textContent = langData[lang].WeatherForcast;
    }
    const refreshLang = document.querySelectorAll(".Refresh");
    for (let i = 0; i < refreshLang.length; i++) {
        refreshLang[i].textContent = langData[lang].Refresh;
    }
    const gvLang = document.querySelectorAll(".GraphicalVersion");
    for (let i = 0; i < gvLang.length; i++) {
        gvLang[i].textContent = langData[lang].GraphicalVersion;
    }

    // setting page
    const textSettingList = document.querySelectorAll(".Setting");
    for (let i = 0; i < textSettingList.length; i++) {
        textSettingList[i].textContent = langData[lang].Setting;
    }
    const textFS = document.querySelector(".FontSize");
    textFS.textContent = langData[lang].FontSize;
    const textLang = document.querySelector(".Language");
    textLang.textContent = langData[lang].Language;
    const textTextList = document.querySelectorAll(".Text");
    for (let i = 0; i < textTextList.length; i++) {
        textTextList[i].textContent = langData[lang].Text;
    }
    const apLang = document.querySelector(".Appearance");
    apLang.textContent = langData[lang].Appearance;
    const modeLang = document.getElementById("DarkMode");
    modeLang.textContent = langData[lang].DarkMode;
    const clLang = document.querySelector(".currentLang");
    clLang.textContent = langData[lang].currentLang;
    const tuLang = document.querySelector(".TempUnit");
    tuLang.textContent = langData[lang].TempUnit;
}

// switching 4 containers
function showSetting(click){
    document.getElementById("currentWeather").hidden = true;
    document.getElementById("COLW").hidden = true;
    document.getElementById("COLWdata").hidden = true;
    document.getElementById("setting").hidden = false;
    if (click == "navbar"){
        const bsCollapse = new bootstrap.Collapse('#navbarSupportedContent', {
            hide: true
        })
    }
}
function showCurrentWeather(){
    document.getElementById("currentWeather").hidden = false;
    document.getElementById("COLW").hidden = true;
    document.getElementById("COLWdata").hidden = true;
    document.getElementById("setting").hidden = true;
    const bsCollapse = new bootstrap.Collapse('#navbarSupportedContent', {
        hide: true
    })
    refreshData();
}
function showCOLW(){
    document.getElementById("currentWeather").hidden = true;
    document.getElementById("COLW").hidden = false;
    document.getElementById("COLWdata").hidden = true;
    document.getElementById("setting").hidden = true;
    const bsCollapse = new bootstrap.Collapse('#navbarSupportedContent', {
        hide: true
    })
}
function showCOLWdata(){
    document.getElementById("currentWeather").hidden = true;
    document.getElementById("COLW").hidden = true;
    document.getElementById("COLWdata").hidden = false;
    document.getElementById("setting").hidden = true;
}

// expand the graph
function changebuttonicon(){
    if (document.getElementById("graphexpandicon").classList.contains("fa-chevron-down")){
        document.getElementById("graphexpandicon").classList.remove("fa-chevron-down");
        document.getElementById("graphexpandicon").classList.add("fa-chevron-up");
    } else {
        document.getElementById("graphexpandicon").classList.remove("fa-chevron-up");
        document.getElementById("graphexpandicon").classList.add("fa-chevron-down");
    }
}

// search bar
function citySearch(){
    let city_keywords_en = ["Taipei, Taiwan", "Toyko, Japan", "Seoul, South Korea", "New York, US", "London, UK", "Sydney, Australia", "Reykjavík , Iceland", "Nairobi, Kenya", "Rio de Janeiro, Brazil", "Antarctica"];
    let city_keywords_zh = ["台灣, 台北", "日本, 東京", "大韓民國, 首爾", "美國, 紐約", "英國, 倫敦", "澳洲, 雪梨", "冰島, 雷克雅維克", "肯亞, 奈洛比", "巴西, 里約熱內盧", "南極洲"];
    let city_keywords_ko = ["타이베이시, 대만", "도쿄, 일본", "뉴욕, 미국", "시티오브런던, 영국", "시드니, 오스트레일리아", "서울특별시, 대한민국", "레이캬비크, 아이슬란드", "나이로비, 케냐", "리우데자네이루, 브라질", "남극"];
    let city_keywords_main;
    switch(localStorage.getItem("language")) {
        case "en": 
            city_keywords_main = city_keywords_en;
            break;
        case "zh":
            city_keywords_main = city_keywords_zh;
            break;
        case "ko":
            city_keywords_main = city_keywords_ko;
            break;
    }

    const resultBox = document.querySelector(".result-box");
    const inputBox = document.getElementById("cityInput");

    let result = [];
    let input = inputBox.value; // get search bar input
    if (input.length){  // get the relative result
        result = city_keywords_main.filter((keyword) => {
            return keyword.toLowerCase().includes(input.toLowerCase());
        });
        display(result);
    }
    
    function display(result){   // show the relative result
        const content = result.map((list) => {
            return '<button type="button" class="list-group-item list-group-item-action" onclick="selectInput(' + "'" + list + "'" + ')">' + list + '</button>';
        })
        resultBox.innerHTML = '<div class="list-group">' + content.join('') + "</div>";
    }

    if (input == ""){   // remove the added list
        resultBox.innerHTML = "";
    }
}
function selectInput(param){
    document.getElementById("cityInput").value = param;
    document.querySelector(".result-box").innerHTML = "";
}

// city translate
const cityTran = {
    "en": 
    {
        "Taipei": "Taipei",
        "Toyko": "Toyko",
        "Seoul": "Seoul",
        "London": "London",
        "New York": "New York",
        "Sydney": "Sydney",
        "Reykjavík": "Reykjavík",
        "Nairobi": "Nairobi",
        "Rio de Janeiro": "Rio de Janeiro",
        "Antarctica": "Antarctica"
    },
    "zh": 
    {
        "台北": "Taipei",
        "東京": "Toyko",
        "首爾": "Seoul",
        "倫敦": "London",
        "紐約": "New York",
        "雪梨": "Sydney",
        "雷克雅維克": "Reykjavík",
        "奈洛比": "Nairobi",
        "里約熱內盧": "Rio de Janeiro",
        "南極洲": "Antarctica"
    },
    "ko": 
    {
        "타이베이시": "Taipei",
        "도쿄": "Toyko",
        "서울특별시": "Seoul",
        "시티오브런던": "London",
        "뉴욕": "New York",
        "시드니": "Sydney",
        "레이캬비크": "Reykjavík",
        "나이로비": "Nairobi",
        "리우데자네이루": "Rio de Janeiro",
        "남극": "Antarctica"
    }
}
// city data
const cityData = {
    "name":[
        "Taipei", "Toyko", "Seoul", 
        "London", "New York", "Sydney",
        "Reykjavík", "Nairobi", "Rio de Janeiro", "Antarctica"
    ], 
    "lat":[
        "25.0375198", "35.689487", "37.5666791",
        "51.5074456", "40.741895", "-33.8698439",
        "64.128288", "-1.286389", "-22.908333", "-76.299965"
    ],
    "lon":[
        "121.5636796", "139.691711", "126.9782914",
        "-0.1277653", "-73.989308", "151.2082848",
        "-21.827774", "36.817223", "-43.196388", "-148.003021"
    ]
}

// search for other location
function searching(){
    let place = "";
    try{
    if (document.getElementById("cityInput").value.includes(",")){
            if (localStorage.getItem("language") == "en"){
                place = cityTran[localStorage.getItem("language")][document.getElementById("cityInput").value.split(",")[0]];
            } else {
                place = cityTran[localStorage.getItem("language")][document.getElementById("cityInput").value.split(", ")[1]];
            }
        } else { place = cityTran[localStorage.getItem("language")][document.getElementById("cityInput").value];}
    } catch {
        document.getElementById("cityNotFoundAlert").hidden = false;
        document.getElementById("cityInput").value = "";
    }
    if (cityData.name.includes(place)){
        const position = cityData.name.indexOf(place);
        document.getElementById("cityInput").value = "";
        showCOLWdata();
        loader();
        retrieveData_other(cityData.name[position], cityData.lat[position], cityData.lon[position]);
    } else {
        // alret to city name not find
        document.getElementById("cityNotFoundAlert").hidden = false;
        document.getElementById("cityInput").value = "";
    }
}
// get data for other location
function retrieveData_other(city, lat, lon){
    // Get the data here
    const xhr = new XMLHttpRequest();
    let weather_url = "https://api.open-meteo.com/v1/forecast?current=temperature_2m,relative_humidity_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FSingapore";
    if (localStorage.getItem("degreeUnit") == "°F"){
        weather_url += "&temperature_unit=fahrenheit";
    }
    weather_url = weather_url + "&latitude=" + lat + "&longitude=" + lon;
    //console.log(weather_url)
    xhr.open("get", weather_url);
    xhr.send();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            let data = JSON.parse(xhr.response);
            displaydata_other(city, data);
        }
    };
}
// show data for other location
function displaydata_other(city, data){
    // show the place
    function getTranName(city){
        return Object.keys(cityTran[localStorage.getItem("language")]).find(key =>
            cityTran[localStorage.getItem("language")][key] === city);
    }
    document.getElementById("place_other").innerHTML = getTranName(city);

    // show the current temp
    document.getElementById("temp_other").innerHTML = data.current.temperature_2m + data.current_units.temperature_2m;
    document.getElementById("humidity_other").innerHTML = data.current.relative_humidity_2m;

    // show the weather pic
    let weatherCode = parseInt(data.current.weather_code);
    document.getElementById("currentweatherImg_other").src = imgSource(weatherCode);
    
    // show the update date and time
    let datatime = data.current.time.replace("T", " ");
    document.getElementById("updateTime_other").innerHTML = datatime;

    // show forecast data
    let tempcontent = "";
    for (let i = 0; i < data.daily.time.length; i++){
        tempcontent += displaydataForecast(i, data)
        if (i != data.daily.time.length-1){
            tempcontent += "<hr>"
        }
    }
    document.getElementById("forecast_other").innerHTML = tempcontent;

    // show the graphic
    displayforecastgraphic(data, "forecastChart_other")  
}
// refresh other location data
function refreshData_other(){
    document.getElementById("cityInput").value = document.getElementById("place_other").innerHTML;
    searching();
    loader();
}
// expand the other location graph
function changebuttonicon_other(){
    if (document.getElementById("graphexpandicon_other").classList.contains("fa-chevron-down")){
        document.getElementById("graphexpandicon_other").classList.remove("fa-chevron-down");
        document.getElementById("graphexpandicon_other").classList.add("fa-chevron-up");
    } else {
        document.getElementById("graphexpandicon_other").classList.remove("fa-chevron-up");
        document.getElementById("graphexpandicon_other").classList.add("fa-chevron-down");
    }
}

// loader animation
function loader(){
    const loader = document.querySelector(".loader");
    loader.classList.remove("loader-hidden");
    setTimeout(closeLoader = () => {
        loader.classList.add("loader-hidden");
    }, 1000);
}
