require([
    '$api/models',
    '$views/list#List',
    '$api/search#Search',
], function(Models, List, Search) {
  'use strict';

  //SEARCH CONSTANTS
  var SEARCH_PAGE_SIZE = 200; // The maximum number of search results to consider in the spotify database
  var MAXIMUM_RESULT_SIZE = 25; // The maximum number of songs to show in our cover and remix graphs
  var currentTrack;

  var server = 'http://samplifybackend.herokuapp.com/';

  //D3 CONSTANTS
  var scale = d3.scale.linear().domain([0, 100]).range([10, 90]);

  // COVER
  var COVER_FILTER = ["cover", "made famous by", "tribute", "instrumental", "karaoke", "in the style of", "version", "originally by", "originally performed"];

  function sortTracksByPopularity(searchResult) {
    var sortedList = searchResult.sort(function(track1, track2) {
      return track2.popularity - track1.popularity; // weird piece of code but it is apparantly working :S
    });
    return sortedList;
  }

  function getCleanTrackName(trackName) {
    var indexOfSubtitle = trackName.indexOf("-");
    if (indexOfSubtitle != -1) trackName = trackName.substring(0, indexOfSubtitle);
    indexOfSubtitle = trackName.indexOf("(");
    if (indexOfSubtitle != -1) trackName = trackName.substring(0, indexOfSubtitle);
    return trackName;
  }

  // returns true if at least one of the items in the current artist list
  // is included (partially) in any of the items in the match list or
  // false otherwise

  function containsArtist(current, match) {
    for (var i = 0; i < current.length; i++) {
      for (var j = 0; j < match.length; j++) {
        if (current[i].uri == match[j].uri) // match uri as they are unique for every artist
          return true;
      }
    }
    return false;
  }

  function loadTracks(tracks){

  }

  function samplesGraph(result,callback){
    currentTrack = Models.player.track;
    console.log("Samples Result", result);
    var tracks = [];
    var graph = {
      'name': currentTrack.name,
      // 'artist': currentTrack.artists.name,
      // Fix this as well
      // 'album': currentTrack.name,
      'albumArt': currentTrack.image,
      'size': scale(currentTrack.popularity),
      'uri': currentTrack.uri,
      'children': []
    };
    if(result.length > 0){
      for (var i = 0; i < result.length; i++) {
        tracks.push(result[i].sampling_track);
        tracks.push(result[i].sampled_track);
      };
      for (var i = 0; i < tracks.length; i++) {
        (function(track) {
          Models.Track.fromURI(track).load('name', 'duration', 'image', 'album').done(function(track) {
            // console.log(track);
            graph['children'].push(
              {
                'name': track.name,
                // 'artist': track.artists.name,
                // Fix album Name
                // 'album': track.name,
                'albumArt': track.image,
                'size': scale(track.popularity),
                'uri': track.uri
              });
          });
         })(tracks[i]);
         callback(null,graph);
      };
      //
    }
    else
    {
      console.log("No Samples!");
      callback(null,null);
    }

  }

  function remixGraph(searchResults,callback) {
    // Get current artist list
    Models.player.load('track').done(function() {
      var result = [];

      for (var i = 0; i < searchResults.length; i++) {
        // Check so that we have not found enough tracks already
        if (result.length >= MAXIMUM_RESULT_SIZE) break;

        // A track is only a remix if it contains the current artist as one of the artists
        if (!containsArtist(Models.player.track.artists, searchResults[i].artists)) continue;
        result.push(searchResults[i]);
      }
      if (result.length > 0) {
        // console.log("Result for Remix is " , result);
        // loadCircleGraph(formatDataForGraph(data, "remix"), "#graphRemix", pickedSongFromGraph);
        // formatDataForGraph(result, "remix");
        var graphResult = [];
        for (var i = 0; i < result.length; i++) {
          graphResult[i] = {
            'name': result[i].name,
            'artist': result[i].artists,
            'album': result[i].album.name,
            'albumArt': result[i].album.image,
            'size': scale(result[i].popularity),
            'uri': result[i].uri
          };
        }
        var graph = {
          'name': currentTrack.name,
          'artist': currentTrack.artists,
          'album': currentTrack.album.name,
          'albumArt': currentTrack.album.image,
          'size': scale(currentTrack.popularity),
          'uri': currentTrack.uri,
          'children': graphResult
        };
        callback(null,graph);
      } else {;
        console.log("No Remixes!");
        callback(null,null);
      }
    });
  }

  function coverGraph(searchResults,callback) {
    // Get current artist list
    Models.player.load('track').done(function() {
      var result = [];

      for (var i = 0; i < searchResults.length; i++) {

        // Check so that we have not found enough tracks already
        if (result.length >= MAXIMUM_RESULT_SIZE) break;

        // A track is only a cover if it DOES NOT contain the current artist
        if (containsArtist(Models.player.track.artists, searchResults[i].artists)) continue;

        // Make sure the track matches any of our cover tags
        // Actually, is this necessary?
        for (var j = 0; j < COVER_FILTER.length; j++) {
          if (searchResults[i].name.toLowerCase().indexOf(COVER_FILTER[j]) != -1) {
            result.push(searchResults[i]);
            break;
          }
        }
      }
      if (result.length > 0) {
        // console.log("Result for Remix is " , result);
        // loadCircleGraph(formatDataForGraph(data, "remix"), "#graphRemix", pickedSongFromGraph);
        // formatDataForGraph(result, "remix");
        var graphResult = [];
        for (var i = 0; i < result.length; i++) {
          graphResult[i] = {
            'name': result[i].name,
            'artist': result[i].artists,
            'album': result[i].album.name,
            'albumArt': result[i].album.image,
            'size': scale(result[i].popularity),
            'uri': result[i].uri
          };
        }
        var graph = {
          'name': currentTrack.name,
          'artist': currentTrack.artists,
          'album': currentTrack.album.name,
          'albumArt': currentTrack.album.image,
          'size': scale(currentTrack.popularity),
          'uri': currentTrack.uri,
          'children': graphResult
        };
        callback(null,graph);
      } else {;
        console.log("No Covers!");
        callback(null,null);
      }
    });
  }

  function searchSpotify(type, callback) {
    Models.player.load('track').done(function() {
      if (Models.player.track === null || Models.player.track.isAd === true) return; // no track playing

      // Get the track name
      currentTrack = Models.player.track;
      var currentTrackName = getCleanTrackName(currentTrack.name);
      var searchString = "\"" + currentTrackName + "\"";

      var search = Search.search(searchString);
      search.tracks.snapshot(0, SEARCH_PAGE_SIZE).done(function(snapshot) {

        // This is to load the album name into the resulting array
        var promises = [];
        var results = snapshot.toArray();
        results.forEach(function(result) {
          promises.push(result.album.load('name'));
        });
        // Load all promises (always means done/fail does not matter, always called)
        Models.Promise.join(promises).always(function(albums) {
          for (var i = 0; i < results.length; i++)
            results[i].album.name = albums[i].name; // add the album name to the result tracks
          if (type === "remix")
            remixGraph(sortTracksByPopularity(results), callback); // return the results sorted by popularity in the callback
          if (type === "cover")
            coverGraph(sortTracksByPopularity(results), callback); // return the results sorted by popularity in the callback
        });
      }).fail(function(err) {
        console.error('Error retrieving snapshot');
        callback(err);
      });
    }).fail(function(err) {
      console.error("Erorr retrieving current track.");
      callback(err);
    });
  }

  function getSamples(callback){
    Models.player.load('track').done(function() {
      if (Models.player.track === null || Models.player.track.isAd === true) return; // no track playing

      // Get the track name
      currentTrack = Models.player.track;
      var currentTrackURI = getCleanTrackName(currentTrack.uri);
      console.log("Current Track URI is ", currentTrackURI);
      $.ajax({
          url: server + 'track?id=' + currentTrackURI,
          type: 'get',
          success: function (data) {
            var dataJSON = $.parseJSON(data);
            samplesGraph(dataJSON.samples, callback);
          }
        });
    });
  }

  exports.getGraph = function(type, callback){
    if(type === 'samples')
      getSamples(callback);
    else
      searchSpotify(type, callback);
  }
});