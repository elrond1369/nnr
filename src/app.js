/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var UI = require('ui');
var Settings = require('settings');
var ajax = require('ajax');
var Vibe = require('ui/vibe');
var routes = [];
var directs = [];
var stops;
var mainMenu;
var routeMenu;
var stopMenu;
var directsMenu;
var colorMenu;
var presetMenu;
var platform;
if(!Pebble.getActiveWatchInfo) {
  platform = 'aplite';
} else {
  platform = Pebble.getActiveWatchInfo();
  platform = platform.platform;
}
var currentRoute = {id:'0',name:''};
var currentDirect = {id:'0',name:''};
var currentStop = {id:'0',name:''};
console.log(Settings.data());
var presets = Settings.data('presets');
if(presets===undefined) {
  presets=[];
  Settings.data('presets', presets);
}
var colors = [{id:'cobaltBlue',name:'Blue'},{id:'imperialPurple',name:'Purple'},{id:'mayGreen',name:'Green'},{id:'roseVale',name:'Red'},{id:'rajah',name:'Orange'}];
var color = Settings.data('color');
if(color===undefined) {
  Settings.data('color','0');
  color = '0';
}
  color = colors[color];
console.log(Settings.data('color'));
var helpGuide = [{name:'Save Favorites',text:"\nWhen you found the stop you want to save simpily highlight the stop then press and hold select."}, {name:'Remove Favorites',text:'Highlight the favorite you want to remove then press and hold select'}];
color = colors[Settings.data('color')].id;
var headers = {"Host": "www.nextconnect.riderta.com",
              "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:41.0) Gecko/20100101 Firefox/41.0",
              "Accept": "application/json, text/javascript, */*; q=0.01",
              "Accept-Language": "en-US,en;q=0.5",
              "Accept-Encoding": "gzip, deflate",
              "Content-Type": "application/json; charset=utf-8",
              "Referer": "http://jacobsommerfeld.net/pebbleapps/nextconnect/settings.html",
              "Origin": "http://jacobsommerfeld.net",
              "Connection": "keep-alive",
              "Pragma": "no-cache",
              "Cache-Control": "no-cache",
              "Content-Length": "0"
             };
var splashCard;
if(platform!='aplite') {
  splashCard = new UI.Card({title: 'Next Ride',subtitle: 'Loading...',backgroundColor:color,titleColor:'white',subtitleColor:'white'});
} else {
  splashCard = new UI.Card({title: 'Next Ride',subtitle: 'Loading...'});
}
var loadTimes = function() {
  splashCard.show();
  ajax(
    {
      url: 'http://www.nextconnect.riderta.com/Arrivals.aspx/getStopTimes',
      type: 'json',
      method: 'post',
      headers:headers,
      data: {'routeID':currentRoute.id, directionID:currentDirect.id, stopID: currentStop.id, useArrivalTimes: false}
    },
    function(data) {
       if(data.d.stops[0].crossings===null) {
        var noCard;
         var bodyText = "\n"+currentStop.name+"\n\nThere are no buses sceduled any time soon...check back in a bit";
        if(platform!='aplite') {
          noCard = new UI.Card({title:'No Buses',body:bodyText, scrollable:true, backgroundColor:color,titleColor:'white',subtitleColor:'white',bodyColor:'white'});
        } else {
          noCard = new UI.Card({title:'No Buses',body:bodyText, scrollable:true});
        }
        noCard.show();
        splashCard.hide();
        return;
      }
      var times = data.d.stops[0].crossings;
      var items = [];
      for(var i=0; i<times.length; i++) {
        var time = times[i];
        var predString = '';
        var predPeriod = time.predPeriod;
        if(predPeriod=='am') {
          predPeriod = 'AM';
        } else {
          predPeriod = 'PM';
        }
        var schedPeriod = time.schedPeriod;
        if(schedPeriod=='am') {
          schedPeriod = "AM";
        } else {
          schedPeriod = "PM";
        }
        if(time.predTime===null) {
          predString='N/A';
        } else {
          predString = time.predTime+''+predPeriod;
        }
        var item = {title:'Predicted: '+predString,
                    subtitle:'Scheduled: '+time.schedTime+''+schedPeriod
                   };
        items.push(item);
      }
      var timesMenu = new UI.Menu({
        backgroundColor: 'white',
        textColor: color,
        highlightBackgroundColor: 'white',
        highlightTextColor: color,
      sections:[
        {title:currentStop.name, items:items}
      ]
      });
      timesMenu.show();
      splashCard.hide();
    }
  );
};
var loadStops = function() {
  splashCard.show();
  ajax(
  {
    url:'http://www.nextconnect.riderta.com/Arrivals.aspx/getStops',
    type:'json',
    method:'post',
    headers:headers,
    data: {'routeID':currentRoute.id, 'directionID':currentDirect.id}
  },
  function(data){
    var items=[];
    stops = data.d;
    for(var i=0; i<stops.length; i++) {
      var item = {title:stops[i].name};
      items.push(item);
    }
    stopMenu = new UI.Menu({
      backgroundColor: 'white',
        textColor: color,
        highlightBackgroundColor: color,
        highlightTextColor: 'white',
      sections:[{
        title:'Stops',
        items:items
      }]
    });
    stopMenu.show();
    splashCard.hide();
    stopMenu.on('select', function(e){
      currentStop = {'id':stops[e.itemIndex].id, 'name':e.item.title};
      loadTimes();
    });
    stopMenu.on('longSelect', function(e){
      currentStop = {'id':stops[e.itemIndex].id, 'name':e.item.title};
      var preset = {route:currentRoute,direct:currentDirect, stop:currentStop};
      presets.push(preset);
      Settings.data('presets', presets);
      Vibe.vibrate('short');
    });
  });
};
var loadDirects = function() {
  splashCard.show();
  ajax(
  {
    url:'http://www.nextconnect.riderta.com/Arrivals.aspx/getDirections',
    type:'json',
    method:'post',
    headers:headers,
    data: {'routeID':currentRoute.id}
  },
  function(data){
    var items = [];
    directs = data.d;
    for(var i=0; i<directs.length; i++) {
      var item = {title:directs[i].name};
      items.push(item);
    }
    directsMenu = new UI.Menu({
      backgroundColor: 'white',
        textColor: color,
        highlightBackgroundColor: color,
        highlightTextColor: 'white',
      sections:[{
        title:'Directions',
        items:items
      }]
    });
    directsMenu.show();
    directsMenu.on('select', function(e){
      currentDirect = {id:directs[e.itemIndex].id,name:e.item.title};
      loadStops();
    });
    splashCard.hide();
  });
};
var loadRoutes = function() {
  splashCard.show();
  ajax(
    {
      url:'http://www.nextconnect.riderta.com/Arrivals.aspx/getRoutes',
      type:'json',
      method:'post',
      headers: headers,
    },
    function(data) {
      routes = data.d;
      var items=[];
      for(var i=0; i<routes.length; i++) {
        items.push({title:routes[i].name});
      }
      routeMenu = new UI.Menu({
        backgroundColor: 'white',
        textColor: color,
        highlightBackgroundColor: color,
        highlightTextColor: 'white',
        sections: [{
          title: 'Routes',
          items: items
        }]
      });
      routeMenu.show();
      splashCard.hide();
      routeMenu.on('select', function(e){
        currentRoute = {id:routes[e.itemIndex].id, name:e.item.title};
        loadDirects();
      });
    },
    function(error, status) {
      console.log(status);
      console.log(error);
    }
  );
};
var listPresets = function() {
    if(presets.length===0) {
      var presetCard;
      if(platform!='aplite') {
        presetCard= new UI.Card({backgroundColor:color,titleColor:'white',subtitleColor:'white',bodyColor:'white',scrollable:true,'title':'Favorites','subtitle':'Getting Started','body':'You can save stops as favorites for easy access. To save a stop find the stop you want using "all stops". When you find the stop your want to save simpily press and hold "select" until the watch vibrates'+"\n\n"+'You can remove a favorite, you have added, by pressing and holding "select" when it is highlighted'});
      } else {
        presetCard= new UI.Card({scrollable:true,'title':'Favorites','subtitle':'Getting Started','body':'You can save stops as favorites for easy access. To save a stop find the stop you want using "all stops". When you find the stop your want to save simpily press and hold "select" until the watch vibrates'+"\n\n"+'You can remove a favorite, you have added, by pressing and holding "select" when it is highlighted'});
      }
        presetCard.show();
      return;
    }
    var items = [];
    for(var i=0; i<presets.length; i++) {
      var direct = presets[i].direct.name;
      direct = direct.split('');
      var item = {title:'('+direct[0]+') '+presets[i].route.name,subtitle:presets[i].stop.name};
      items.push(item);
    }
    presetMenu = new UI.Menu(
      {
        backgroundColor: 'white',
        textColor: color,
        highlightBackgroundColor: color,
        highlightTextColor: 'white',
        sections:[{'title':'Favorits',items:items}]
      }
      );
    presetMenu.show();
    presetMenu.on('select',function(e){
      var preset = presets[e.itemIndex];
      currentRoute = preset.route;
      currentDirect = preset.direct;
      currentStop = preset.stop;
      loadTimes();
    });
  presetMenu.on('longSelect', function(e) {
    presets.splice(e.itemIndex, 1);
    Settings.data('presets', presets);
    presetMenu.hide();
    listPresets();
  });
};
var listColors = function() {
  var items = [];
  for(var i=0;i<colors.length;i++) {
    var item = {title:colors[i].name};
    items.push(item);
  }
  colorMenu = new UI.Menu({
    backgroundColor:'white',
    textColor:color,
    highlightBackgroundColor:color,
    highlightTextColor:'white',
    sections:[{title:'Set Color',items:items}]
  });
  colorMenu.show();
  colorMenu.on('select', function(e){
    Settings.data('color', e.itemIndex);
    color=colors[e.itemIndex].id;
    colorMenu.hide();
    mainMenu.hide();
    showMenu();
  });
};
var showMenu = function() {
  var menuItems =[{title:'Favorites'},{title:'All Stops'},{title:'Help'},{title:'About'}];
if(platform!='aplite') {
  menuItems.push({title:'Select Color'});
}

mainMenu = new UI.Menu({
  backgroundColor: 'white',
  textColor: color,
  highlightBackgroundColor: color,
  highlightTextColor: 'white',
  sections:[{
    title:"Nova's Next Ride",
    items: menuItems
  }]
});
mainMenu.show();
mainMenu.on('select', function(e){
  if(e.itemIndex==1) {
    loadRoutes();
  }
  if(e.itemIndex===0) {
    listPresets();
  }
  if(e.itemIndex==3) {
    var aboutCard;
    var aboutText = "\n___Developer___\n* J. S. Web Dev\n* novaswd.com\n\n___Data From__\n* GCRTA\n* riderta.com";
    if(platform!='aplite') {
      aboutCard = new UI.Card({title:'About',body:aboutText,scrollable:true,backgroundColor:color,titleColor:'white',bodyColor:'white'});
    } else {
      aboutCard = new UI.Card({title:'About',body:aboutText,scrollable:true});
    }
    aboutCard.show();
  }
  if(e.itemIndex==4) {
    listColors();
  }
  if(e.itemIndex==2) {
    var items = [];
    var helpMenu;
    for(var i = 0; i<helpGuide.length; i++) {
        var item = {title:helpGuide[i].name};
        items.push(item);
      }
    helpMenu = new UI.Menu({backgroundColor:'white',textColor:color,highlightBackgroundColor:color,highlightTextColor:'white', scrollable:true, sections:[{title:'Help', items:items}]});
    helpMenu.show();
    helpMenu.on('select', function(e) {
      var helpText = "\n"+helpGuide[e.itemIndex].text;
      var helpCard;
      if(platform!='aplite') {
        helpCard = new UI.Card({title:e.item.title,body:helpText, scrollable:true, backgroundColor:color,titleColor:'white',bodyColor:'white'});
      } else {
        helpCard = new UI.Card({title:e.item.title,body:helpText, scrollable:true});
      }
      helpCard.show();
    });
    }
  });
};
showMenu();