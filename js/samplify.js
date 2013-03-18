// var initTime = ISODateString(new Date());
// var dawn = (new Date()).getTime();

sp = getSpotifyApi(1);
window.onload = function() {
  var models = sp.require('sp://import/scripts/api/models');
  var views = sp.require('sp://import/scripts/api/views');
  var player = models.player;
  var library = models.library;
  var application = models.application;
  var root = 'spotify:app:' + window.location.hostname + ":";
  var server = 'http://samplify.herokuapp.com/';

  var submitSample = {};
  //Data values
  var currentTrackSampled;

  // Handle tabs, do we need this?
  tabs();
  samples_drop();
  //First time use
  clearTracks();
  updateTracks();

  application.observe(models.EVENT.ARGUMENTSCHANGED, tabs);

  player.observe(models.EVENT.CHANGE, function(event) {
    console.log(event);
    if (event.data.curtrack) {
      console.log("CurTrack");
      // clearTracks();
      // updateTracks();
    }

  });


  //Handle Arguments
  application.observe(models.EVENT.ARGUMENTSCHANGED, handleArgs);

  // Handle items 'dropped' on your icon
  application.observe(models.EVENT.LINKSCHANGED, handleLinks);


  function handleArgs() {
    var args = models.application.arguments;
    console.log(args);
    $.each(args, function(i, arg) {
      args[i] = decodeURI(arg.decodeForText());
    }); //decode crazy swede characters
    args = $.grep(args, function(n) {
      return (n);
    }); // remove empty
  }

  function handleLinks() {
    var links = models.application.links;
    console.log(links);
  }

  $("#refresh").click(function() {
    clearTracks();
    updateTracks();
  });
  $("#remixRefresh").click(function() {
    clearTracks();
    updateTracksRemix();
  });

  $("#submitSample").click(function() {
    console.log("Submitting Sample");
    submitSample['time1'] = "0";
    submitSample['time2'] = "0";
    // submitSample['relationship'] = {};
    // if(!submitSample['relationship']['partsampled']) submitSample['relationship']['partsampled'] = "Other";
    submitSample['kind'] = $("#kind").val();
    // submitSample['relationship']['kind'] = $("#partsampled").val();

    console.log(submitSample);
    // data={'track1_uri': 'spotify:track:6Qb7gtV6Q4MnUjSbkFcopl', 'track2_uri': 'spotify:track:51bzMalhzAi8GyyPXBG8qV', 'time1': 0, 'time2': 3, 'relationship': {"partsampled" : "Whole Track", "kind" : "Direct Sample"}})
    (function(data) {
      // console.log("Sending data");
      // console.log(data);
      $.ajax({
        type: "PUT",
        url: 'http://samplify.herokuapp.com/add',
        data: data,
        error: function(e) {
          console.log("Error Submitting, try again!");
          console.log(e);
        },
        success: function(e) {
          console.log("Success Submitting!");
          alert("Thanks for submitting!");
          $("#drop_box_sampling").empty();
          $("#drop_box_sampling").html("<p>Drag sampled track here</p>");
          $("#drop_box_sampled").empty();
          $("#drop_box_sampled").html("<p>Drag sampling track here</p>");
        }
      });
    })(submitSample);

  });

  // $(window).keypress(function(e) {
  //   if (e.keyCode == 0) {
  //     console.log('Space pressed');
  //   }
  // });

  function samples_drop() {

    //Why do this?
    $.event.props.push('dataTransfer');

    $('#drop_box_sampling')
      .live('dragenter', function(e) {
      // console.log('Entered');
      $(this).addClass('over');
      // e.dataTransfer.setData('text/html', this.innerHTML);
      e.dataTransfer.effectAllowed = 'copy';
    })
      .live('dragleave', function(e) {
      // $(this).removeClass('over');
      console.log('Leaving');
      // $(this).removeClass('hovering');
    })
      .live('dragover', function(e) {
      // console.log('Dragging over');
      $(this).addClass('over');
      e.preventDefault();
      // e.dataTransfer.dropEffect = 'copy';
      // $(this).addClass('hovering');

    })
      .live('drop', function(e) {

      // console.log('Drop!');
      $(this).removeClass('over');
      e.stopPropagation();
      e.preventDefault();
      var track = models.Track.fromURI(e.dataTransfer.getData('text'));
      console.log(track);

      //Set Submit
      submitSample["track1_uri"] = track.uri;
      console.log("Track1 " + track.uri);

      //Create Sample Context
      var sampling_track_playlist = new models.Playlist();
      sampling_track_playlist.add(track.uri);
      var sampling_track_player = new views.Player();
      sampling_track_player.track = null;
      sampling_track_player.context = sampling_track_playlist;

      //Update!
      $(sampling_track_player.node).addClass('sp-image-extra-large');
      $(this).html("<p>Drag sampled track here</p>");

      $(this).append(sampling_track_player.node);

    });


    $('#drop_box_sampled')
      .live('dragenter', function(e) {
      // console.log('Entered');
      $(this).addClass('over');
      // e.dataTransfer.setData('text/html', this.innerHTML);
      e.dataTransfer.effectAllowed = 'copy';
    })
      .live('dragleave', function(e) {
      // $(this).removeClass('over');
      console.log('Leaving');
      // $(this).removeClass('hovering');
    })
      .live('dragover', function(e) {
      // console.log('Dragging over');
      $(this).addClass('over');
      e.preventDefault();
      // e.dataTransfer.dropEffect = 'copy';
      // $(this).addClass('hovering');

    })
      .live('drop', function(e) {

      console.log('Drop!');
      $(this).removeClass('over');
      e.stopPropagation();
      e.preventDefault();
      var track = models.Track.fromURI(e.dataTransfer.getData('text'));
      console.log(track);

      //Set Submit
      submitSample["track2_uri"] = track.uri;
      console.log("Track2 " + track.uri);

      //Create Sample Context
      var sampled_track_playlist = new models.Playlist();
      sampled_track_playlist.add(track.uri);
      var sampled_track_player = new views.Player();
      sampled_track_player.track = null;
      sampled_track_player.context = sampled_track_playlist;

      //Update!
      $(sampled_track_player.node).addClass('sp-image-extra-large');
      $(this).html("<p>Drag sampling track here</p>");

      $(this).append(sampled_track_player.node);

    });
    // $("#sampling_slider").slider({ animate: "slow", max: "50"});
    // $("#sampled_slider").slider({ animate: "slow", max: "50"});
  }


  function clearTracks() {
    $("#trackSamples").empty();
    $("#trackHeader").empty();
    $("#search-results").empty();
    $("#noSamplesRemix").empty();
    $("#artistHeaderList").empty();
  }

  function tabs() {
    var args = models.application.arguments;
    var current = document.getElementById(args[0]);
    var sections = document.getElementsByClassName('section');
    for (i = 0; i < sections.length; i++) {
      sections[i].style.display = 'none';
    }
    current.style.display = 'block';
  }

  // This might not be necessary
  /*
    function searchSamplifyDBForRemixAndDisplay()
    {
        var resultsDiv = $("<div></div>").addClass("remixResult");
        resultsDiv.append("<h2>Remixes</h2>");
      resultsDiv.append("<div>No tracks here!</div>"); // default
        
      // Search our database for remixes
        var currentTrackURI = getCurrentTrackURI();
        $.getJSON(getSamplingURLForTrack(currentTrackURI.toString()),function(result)
        {
          var playlistArt = new views.Player();
          var tempPlaylist = new models.Playlist();
          var playlistList = new views.List(tempPlaylist);
          playlistArt.context = tempPlaylist;
  
          var resultsPlayer = $("<div></div>").addClass("remixPlayer");

          // Go through dbResult to see if any results in our database
          // matches the current category. This is step 1.
          var count = result.samples.length;
          for (var i = 0; i < count; i++)
          {
              var currentResult = result.samples[i];
              models.Track.fromURI(currentResult.track1, function(currentResultTrack) {
              // Make sure the result is the right kind of sample
              // and that it matches the current category. This is asynchronus.
              if (currentResult.relationship.kind == "Remix" ||
              currentResult.relationship.kind == "Cover Version (Remake)")
              {
                    tempPlaylist.add(currentResultTrack);
                    if (tempPlaylist.length == 1) // the first track was added - make playlist view
                    {
                      resultsDiv.empty();
                      resultsDiv.append("<h2>Remixes</h2>");
                      resultsDiv.append(resultsPlayer);
                      playlistArt.track = tempPlaylist.get(0);
                      resultsPlayer.append(playlistArt.node);
                      resultsDiv.append(playlistList.node);
                  }
              }
              });
          }
        
        });
        $("#search-results").append(resultsDiv);
    }
     */

  // Takes a search result array and searches the tracks
  // based on popularity

  function sortTracksByPopularity(searchResult) {
    var sortedList = searchResult.sort(function(track1, track2) {
      return track2.popularity - track1.popularity; // weird piece of code but it is apparantly working :S
    });
    return sortedList;
  }

  // returns true if at least one of the items in the current artist list
  // is included (partially) in any of the items in the match list or
  // false otherwise

  function containsArtist(current, match) {
    for (var i = 0; i < current.length; i++) {
      for (var j = 0; j < match.length; j++) {
        if (current[i].name.indexOf(match[j].name) != -1) // match
        return true;
      }
    }
    return false;
  }

  var SEARCH_SIZE = 200;
  var MAXIMUM_RESULT_SIZE = 15;

  // Returns an array (of maximum resultSize size) of the
  // Spotify searches if you search for this album

  // Filter is an array of phrases that the track title should
  // be matched. If at least one phrase is found, the track
  // is added to the search results.
  // THIS IS NOT USED ATM, WE CONSIDER EVERY TRACK WITH THE SAME
  // ARTIST AND THE SAME TITLE AS A REMIX
  function searchSpotifyForRemixAndDisplayResultsForThisTrack(filter) {
    // Get the track name
    var currentTrackName = getCurrentTrackName();

    // remove unneccessary parts of the track name (if there are any)
    // This is to remove subtitles such as "Levels - Original Version" -> "Levels"
    var indexOfSubtitle = currentTrackName.indexOf("-");
    if (indexOfSubtitle != -1) currentTrackName = currentTrackName.substring(0, indexOfSubtitle);
    indexOfSubtitle = currentTrackName.indexOf("(");
    if (indexOfSubtitle != -1) currentTrackName = currentTrackName.substring(0, indexOfSubtitle);

    var searchString = "\"" + currentTrackName + "\"";
    var result = new Array(); // the results of the search

    var search = new models.Search(searchString);
    search.pageSize = SEARCH_SIZE;
    search.searchPlaylists = false;
    search.observe(models.EVENT.CHANGE, function() {
      // Sort results by popularity
      var sortedList = sortTracksByPopularity(search.tracks);

      for (var i = 0; i < sortedList.length; i++) {

        // Check so that we have not found enough tracks already
        if (result.length > MAXIMUM_RESULT_SIZE) break;

        // A track is only a remix if it contains the current artist
        if (!containsArtist(getCurrentArtistList(), sortedList[i].artists)) continue;

        // for (var j = 0; j < filter.length; j++) {
        //  if (sortedList[i].name.indexOf(filter[j]) != -1) {
        result.push(sortedList[i]);
        // break;
        //}
        //}
      }
      displayResults(result);
    });
    search.appendNext(); // perform search
  }

  // Called when a search for tracks is finished in searchSpotifyForThisTrack()

  function displayResults(tracks) {
    var resultsDiv = $("<div></div>").addClass("remixResult");
    var resultsPlayer = $("<div></div>").addClass("remixPlayer");

    // Add header
    resultsDiv.append(resultsPlayer);

    if (tracks.length) {
      // Setup views
      var playlistArt = new views.Player();
      var tempPlaylist = new models.Playlist();
      var playlistList = new views.List(tempPlaylist);
      playlistArt.context = tempPlaylist;

      // Add all the search results to the playlist
      for (var i = 0; i < tracks.length; i++)
      tempPlaylist.add(models.Track.fromURI(tracks[i].uri));

      // Get nice album art and stuff
      playlistArt.track = tempPlaylist.get(0);
      resultsPlayer.append(playlistArt.node);
      resultsDiv.append(playlistList.node);
    } else {
      resultsDiv.append("<div>No tracks here!</div>");
    }
    // Display the results
    $("#search-results").append(resultsDiv);
  }

  // Searches for a given string and displays a playlist with the result
  // We want to search both the spotify catalog and our cached
  // database for remixes.

  function searchForRemixes() {
    $("#search-results").empty();

    var remixFilter = new Array();
    remixFilter[0] = "mix";
    remixFilter[1] = "remix";

    var coverFilter = new Array();
    coverFilter[0] = "cover";
    coverFilter[1] = "made famous by";
    coverFilter[2] = "tribute";
    coverFilter[3] = "instrumental"
    coverFilter[4] = "karaoke";

    searchSpotifyForRemixAndDisplayResultsForThisTrack(remixFilter);
    //searchSpotifyAndDisplayResultsForThisTrack(coverFilter);
    // searchSamplifyDBForRemixAndDisplay();
  }

  function updateTracksRemix() {
    updateTrackHeader();
    var currentTrack = getCurrentTrack();
    if (currentTrack == null) {
      noSamples();
      return; // no track playing
    }
    // Perform search of current track
    searchForRemixes();
  }

  function getSampledURLForTrack(track) {
    return (server + "track/sampled?id=" + track);
  }

  function getSamplingURLForTrack(track) {
    return (server + "track/sampling?id=" + track);
  }

  function getSampledURLForArtist(artist) {
    return (server + "artist/sampled?id=" + artist);
  }

  function getSamplingURLForArtist(artist) {
    return (server + "artist/sampling?id=" + artist);
  }


  function updateTracks() {

    //Make this smarter
    updateTrackHeader();

    var currentTrack = getCurrentTrack();
    if (currentTrack == null) return; // no track playing

    var currentTrackURI = getCurrentTrackURI();
    $.getJSON(getSampledURLForTrack(currentTrackURI.toString()), function(result) {
      var count = result.samples.length;
      //console.log("Count of Sampled Tracks are " + count);
      for (var i = 0; i < count; i++) {
        updateTrackSample(result.samples[i]);
      }
    });

    $.getJSON(getSamplingURLForTrack(currentTrackURI.toString()),

    function(result) {
      var count = result.samples.length;
      // console.log("Count of Sampling Tracks are " + count);
      for (var i = 0; i < count; i++) {
        updateTrackSample(result.samples[i]);
      }
    });

    updateArtistHeader();
    updateArtists();
  }

  function updateArtists() {

    var artistList = getCurrentArtistList();

    var updatedArtists;
    for (var j = 0; j < artistList.length; j++) {
      //Make calls with closure, how?
      (function(uri, j) {
        $.getJSON(getSamplingURLForArtist(uri),

        function(result) {
          for (var i = 0; i < result.samples.length; i++) {
            updatedArtists = false;
            updateArtistSample(result.samples[i], j);
          }
        });

        $.getJSON(getSamplingURLForArtist(uri),

        function(result) {
          for (var i = 0; i < result.samples.length; i++) {
            // console.log("We are being called too!");
            updatedArtists = false;
            updateArtistSample(result.samples[i], j);
          }
        });
      })(artistList[j].uri, j);

    }
    // console.log(updatedArtists);
    // if(!updatedArtists){
    // noSamples();
    // }
  }

  function addLeadingZero(number) {
    return ((parseInt(number) < 10) ? "0" : "") + parseInt(number);
  }

  function minutesFromSeconds(time) {
    var minutes = Math.floor(time / 60);
    var seconds = time % 60;
    var res = addLeadingZero(minutes.toString()) + ":" + addLeadingZero(seconds.toString());
    return res;
  }

  function setupSampleContent(sample) {
    //Create Sample Context
    var sampling_track = models.Track.fromURI(sample.track1 + "#" + minutesFromSeconds(sample.time1));
    var sampling_track_playlist = new models.Playlist();
    sampling_track_playlist.add(sampling_track);
    var sampling_track_player = new views.Player();
    sampling_track_player.track = null; // Don't play the track right away
    // sampling_track_player.position = minutesFromSeconds(sample.time1);
    sampling_track_player.context = sampling_track_playlist;

    //Update Sample
    $(sampling_track_player.node).addClass('sp-image-extra-large');
    var samplingDiv = $("<div></div>").addClass("sampling");
    samplingDiv.append(sampling_track_player.node);

    //Create Sample Context
    var sampled_track = models.Track.fromURI(sample.track2 + "#" + minutesFromSeconds(sample.time2));
    var sampled_track_playlist = new models.Playlist();
    sampled_track_playlist.add(sampled_track);
    var sampled_track_player = new views.Player();
    sampled_track_player.track = null; // Don't play the track right away
    //sampled_track_player.position = minutesFromSeconds(sample.time2);
    sampled_track_player.context = sampled_track_playlist;

    //Update Sample
    $(sampled_track_player.node).addClass('sp-image-extra-large');
    var sampledDiv = $("<div></div>").addClass("sampled");
    sampledDiv.append(sampled_track_player.node);

    var relnDiv = $("<div></div>").addClass("relationship");
    relnDiv.append((!sample.relationship.partsampled ? "" : sample.relationship.partsampled) + "</br>" + sample.relationship.kind);
    // Uppppppddddddaaaaaattttteeeeee!

    var outerDiv = $("<div></div>").addClass("sample");
    outerDiv.append(samplingDiv);
    outerDiv.append(relnDiv);
    outerDiv.append(sampledDiv);
    return outerDiv;
  }

  // Updates the sample, sampling and the relationship, samples from artists

  function updateArtistSample(sample, id) {

    // console.log("Getting artist samples");
    var tag = "#artist" + (id).toString();
    // console.log("Tag is " + tag);
    var artistSamplesHTML = $(tag);
    artistSamplesHTML.append(setupSampleContent(sample));
  }


  // Update the sample, sampling and the relationship, samples of track

  function updateTrackSample(sample) {

    var trackSamplesHTML = $("#trackSamples");
    trackSamplesHTML.append(setupSampleContent(sample));
  }

  function getCurrentTrackURI() {
    // Get the track that is currently playing
    var currentTrack = player.track;
    var currentTrackURI = player.track.uri;
    //var currentArtistList = player.track.artists;
    //var currentAlbum = player.track.album.name;
    //var currentAlbumURI = player.track.album.uri;

    return currentTrackURI;
  }

  function getCurrentTrack() {
    // Get the track that is currently playing
    var currentTrack = player.track;
    //var currentTrackURI = player.track.uri;
    //var currentArtistList = player.track.artists;
    //var currentAlbum = player.track.album.name;
    //var currentAlbumURI = player.track.album.uri;
    return currentTrack;
  }

  function getCurrentTrackName() {
    // Get the track that is currently playing
    var currentTrack = player.track;
    var currentTrackName = currentTrack.name;
    //var currentTrackURI = player.track.uri;
    //var currentArtistList = player.track.artists;
    //var currentAlbum = player.track.album.name;
    //var currentAlbumURI = player.track.album.uri;
    return currentTrackName;
  }

  function getCurrentArtistListURI() {
    var currentArtistList = player.track.artists;
    var currentArtistListURI = []
    for (var i = 0; i < currentArtistList.length; i++)
    currentArtistListURI.push(currentArtistList[i].uri);
    return currentArtistListURI;
  }

  function getCurrentArtistList() {
    return player.track.artists;
  }

  function updateTrackHeader() {
    var currentTrack = getCurrentTrack();
    if (currentTrack == null) {
      console.log("No track playing!");
      return false;
    } else {
      var currentTrackURI = getCurrentTrackURI();
      var trackheaderHTML = "♫ " + "<a href='" + root + currentTrackURI + "'>" + currentTrack + "</a><div id='artist" + i.toString() + "'></div>";
      $("#trackHeader").html(trackheaderHTML);
      $("#trackHeaderRemix").html(trackheaderHTML);
      return true;
    }
  }

  function updateArtistHeader() {
    var artistList = getCurrentArtistList();
    var artistHeaderList = $("#artistHeaderList");
    for (var i = 0; i < artistList.length; i++) {
      artistHeaderList.append('<div class="header"><a href="' + root + artistList[i].uri + '">' + artistList[i].name + '</a></div><div id="artist' + i.toString() + '"></div>');
      // artistHeaderList.append('<div class="header">'  + artistList[i].name + '</div><div id="artist' + i.toString() + '"></div>');

    }
  }

  function noSamples() {
    var errorHTML = "<error> No Samples found! </error>";
    var noSamples = $("#noSamples");
    noSamples.html(errorHTML);
    var noSamplesRemix = $("#noSamplesRemix");
    noSamplesRemix.html(errorHTML);
  }

  function consolify() {

    $("#console").html("Track now playing is " + getCurrentTrack());
    $("#console").append("Artists now playing are " + getCurrentArtistList());
  }
}