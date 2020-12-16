// var $j = jQuery.noConflict();

console.log("loaded sofatime.js")

dayjs.extend(window.dayjs_plugin_utc)
dayjs.extend(window.dayjs_plugin_timezone)

jQuery(document).ready(function () {
  if (!Intl || !Intl.DateTimeFormat().resolvedOptions().timeZone) {
    console.log("sofatime: timezone conversion not available in this environment");
    return false;
  }
  sofatimeInitializeStrings();
  jQuery('.sofatimezone-select').on('change', function() {
    s24h = jQuery( this ).closest('.sofatime').find('input[type="checkbox"]:first').prop( "checked" );
    sofatimeChangeAll( this.value, s24h );
  });
  jQuery('.sofatime-24h-checkbox').on('change', function() {
    var tzValue = jQuery( this ).closest('.sofatime').find(".sofatimezone-select").val();
    var s24h = this.checked
    setTimeout(function(){ sofatimeChangeAll( tzValue, s24h ); }, 0)
    setTimeout(function(){ sofatimeAddLocalTimeToOptionNames( s24h ) }, 900);
  });
  sofatimeCheckLocalTimezoneIsInList();
  // sofatimeChangeAll(); // sets min-width with 12h wider timestring (should refactor this)
  sofatimeChangeAll( undefined, localIs24Hour() );
  sofatimeAddLocalTimeToOptionNames();
});

function sofatimeCheckLocalTimezoneIsInList() {
  // list is incomplete. If user's local timezone is not in the list, add it.
  var options = jQuery.map( jQuery('.sofatimezone-select:first option'), function(option) {

    return option.value
  });
  var tz = dayjs.tz.guess();
  if( !options.includes( tz ) ) {
    jQuery('.sofatimezone-select').each(function( index ) {
      jQuery( this ).prepend(`<option value="${tz}">${tz}</option>`);
    });
  }
}

function  sofatimeAddLocalTimeToOptionNames(s24h = false) {
  format = ( s24h ) ? "HH:mm" : "h:mma";
  jQuery( ".sofatime" ).each(function( index ) {
    if(jQuery( this ).data('datetime')) {
      var thisDayjs = dayjs( jQuery( this ).data('datetime') );
      jQuery( this ).find('option').each(function( index, option ) {
        var optionName = jQuery( this ).html().replace(/^\d*:\d\da?p?m? /, "")
        var localTimeString = thisDayjs.tz( option.value ).format( format )
        jQuery( this ).html( localTimeString + " " + optionName)
      })
    }
  });
}


function sofatimeInitializeStrings() {
  var altTZnames = {
    eastern: "America/New_York",
    central: "America/Chicago",
    mountain: "America/Denver",
    pacific: "America/Los_Angeles"
  }
  jQuery( ".sofatime" ).each(function( index ) {
    var inputText = jQuery( this ).find("span:first").text();
    var dateMatches = inputText.match(/\d{4}-\d{2}-\d{2}(T| )\d{2}:\d{2}/g);
    if ( dateMatches && dateMatches.length == 1 && dayjs(dateMatches[0]).isValid() ) {
      var timezone = inputText.replace(dateMatches[0],"").trim();
      if( timezone.match(/^z(ulu)?$/i) ) timezone = "Etc/UTC";
        else timezone = timezone.replace(/^z/i,"").trim();
      timezone = altTZnames[timezone.toLowerCase()] || timezone
      if( isValidTimeZone( timezone ) ){
        var sourceDateTime = dayjs.tz( dateMatches[0], timezone );
        jQuery( this ).data('datetime', sourceDateTime.toISOString() );
      }
    }
    if( jQuery( this ).data('datetime') ) {
      jQuery( this ).find("*").show();
    }
    else {
      jQuery( this ).addClass("sofatime-error");
      jQuery( this ).find("span").prepend("[sofatime]");
      jQuery( this ).find("span").append("[/sofatime]<br />Invalid input. Use a ISO 8601 date and time, followed by a valid timezone name. <br />example: 2020-01-01 15:00 America/New_York<br />Valid timezone names include \"UTC\", a name from the <a href=\"https://en.wikipedia.org/wiki/List_of_tz_database_time_zones\">Timezone Database</a>, or one of the following: Eastern, Central, Mountain, Pacific");
    }
  });
}

function sofatimeChangeAll(tz = dayjs.tz.guess(), s24h = false ) {
  format = ( s24h ) ? "YYYY-MM-DD HH:mm" : "YYYY-MM-DD h:mma";
  jQuery( ".sofatime" ).each(function( index ) {
    if(jQuery( this ).data('datetime')) {
      var datetimeSpan = jQuery( this ).find("span")
      var thisDateFormatted = dayjs( jQuery( this ).data('datetime') ).tz(tz)
      datetimeSpan.text( thisDateFormatted.format(format) );
      // if( parseInt( datetimeSpan.css("width") ) > parseInt( datetimeSpan.css("min-width") ) ) {
      //   datetimeSpan.css("min-width", datetimeSpan.css("width") );
      // }
      jQuery( this ).find(".sofatimezone-select").val( tz );
      jQuery( this ).find('input[type="checkbox"]').prop('checked', s24h);
    }
  });
}

function isValidTimeZone(tz) {
    if (!Intl || !Intl.DateTimeFormat().resolvedOptions().timeZone) {
        throw 'Time zones are not available in this environment';
    }

    try {
        Intl.DateTimeFormat(undefined, {timeZone: tz});
        return true;
    }
    catch (ex) {
        return false;
    }
}

// https://stackoverflow.com/questions/27647918/detect-with-javascript-if-users-machine-is-using-12-hour-clock-am-pm-or-24-cl
function localIs24Hour(locale = navigator.language) {
  return !new Intl.DateTimeFormat(locale, { hour: 'numeric' }).format(0).match(/\s/);
}

// adapted from solution by mrnateriver
// https://stackoverflow.com/questions/9772955/how-can-i-get-the-timezone-name-in-javascript
// not used because it returns "daylight / standard / summer" etc. for today's date, but may not
// apply to the date in question.
// function getTimezoneName() {
//   var sourceDate = new Date();
//   const short = sourceDate.toLocaleDateString(undefined);
//   console.log(short)
//   const full = sourceDate.toLocaleDateString(undefined, { timeZoneName: 'long' });
//   console.log(full)
//   // Trying to remove date from the string in a locale-agnostic way
//   const shortIndex = full.indexOf(short);
//   if (shortIndex >= 0) {
//     const trimmed = full.substring(0, shortIndex) + full.substring(shortIndex + short.length);

//     // by this time `trimmed` should be the timezone's name with some punctuation -
//     // trim it from both sides
//     return trimmed.replace(/^[\s,.\-:;]+|[\s,.\-:;]+$/g, '');

//   } else {
//     // in some magic case when short representation of date is not present in the long one, just return the long one as a fallback, since it should contain the timezone's name
//     return full;
//   }
// }

