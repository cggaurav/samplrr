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
  var SEARCH_PAGE_SIZE = 200;
  var MAXIMUM_RESULT_SIZE = 25;

  var COVER_FILTER = ["cover", "made famous by", "tribute", "instrumental", "karaoke", "in the style of", "version", "originally by", "originally performed"];
  var collabPlaylist = null;
  var SAMPLIFY_COLLAB_PLAYLIST = "spotify:user:cggaurav:playlist:6RR4sZhswpFYkhgCxm5HfC";

  // Handle tabs, do we need this?
  tabs();
  //samples_drop();

  application.observe(models.EVENT.ARGUMENTSCHANGED, tabs);

  player.observe(models.EVENT.CHANGE, function(event) {
    console.log(event);
    if (event.data.curtrack) {
      console.log("CurTrack");
    }
  });

  //Handle Arguments
  application.observe(models.EVENT.ARGUMENTSCHANGED, handleArgs);

  // Handle items 'dropped' on your icon
  application.observe(models.EVENT.LINKSCHANGED, handleLinks);

  //First time use
  refreshInterface();

  // Add songs from collab playlist to carousel div
  models.Playlist.fromURI(SAMPLIFY_COLLAB_PLAYLIST, function(playlist) {
    collabPlaylist = playlist;
    for (var j = 0; j < playlist.length; j++) {
      var collabTrack = playlist.tracks[j];
      if (collabTrack.album === null) continue; // sometimes bogus tracks appear in the playlist
      var cur = "<img src='" + collabTrack.album.data.cover + "' alt='" + collabTrack.uri + "' width='100' height='100' />";
      // Add song
      $(".carouselContent").each(function() {
        $(this).trigger("insertItem", [cur, 0, true, 0]);
      });
    }
  });

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

  function tabs() {
    var args = models.application.arguments;
    var current = document.getElementById(args[0]);
    var sections = document.getElementsByClassName('section');
    for (i = 0; i < sections.length; i++) {
      sections[i].style.display = 'none';
    }
    current.style.display = 'block';

    // make sure the carousels are displayed properly
    initCarousels();
  }

  function refreshInterface() {
    clearTracks();
    updateTracks();

    updateRemix();
    updateCover();
  }

  $("#refresh").click(function() {
    refreshInterface();
  });

  // Called when the window is resized
  $(window).resize(function() {
    initCarousels();
  });

  /*
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
  */

  function clearTracks() {
    $("#trackSamples").empty();
    $("#trackHeader").empty();
    $("#artistHeaderList").empty();
  }

  function splitResultWithRespectToTags(tracks) {
    var result = [];
    for (var i = 0; i < TAGS.length; i++) {
      result[i] = [];
    }

    for (var i = 0; i < tracks.length; i++) {
      var matchFound = false;
      for (var j = 0; j < TAGS.length - 1; j++) {
        // Check for match
        if (tracks[i].name.toLowerCase().indexOf(TAGS[j].toLowerCase()) != -1 || tracks[i].album.name.toLowerCase().indexOf(TAGS[j].toLowerCase()) != -1) {
          result[j].push(tracks[i]);
          matchFound = true;
          break;
        }
      }
      // If no tag match is found we want to insert it into the last position
      if (matchFound === false) {
        result[TAGS.length - 1].push(tracks[i]);
      }
    }
    return result;
  }

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
        if (current[i].uri == match[j].uri) // match
        return true;
      }
    }
    return false;
  }

  // remove unneccessary parts of the track name (if there are any)
  // This is to remove subtitles such as "Levels - Original Version" -> "Levels"

  function getCleanTrackName(track) {
    var indexOfSubtitle = track.indexOf("-");
    if (indexOfSubtitle != -1) track = track.substring(0, indexOfSubtitle);
    indexOfSubtitle = track.indexOf("(");
    if (indexOfSubtitle != -1) track = track.substring(0, indexOfSubtitle);
    return track;
  }

  function searchSpotify(callback) {
    // Get the track name
    var currentTrackName = getCleanTrackName(getCurrentTrackName());
    var searchString = "\"" + currentTrackName + "\"";
    var result = []; // the results of the search

    var search = new models.Search(searchString);
    search.pageSize = SEARCH_PAGE_SIZE;
    search.searchPlaylists = false;
    search.observe(models.EVENT.CHANGE, function() {

      // Sort results by popularity
      var sortedList = sortTracksByPopularity(search.tracks);

      // return results when finished
      callback(sortedList);
    });
    search.appendNext(); // perform search
  }

  // start playing the song that the user picked

  function pickedSongFromGraph(uri) {
    player.play(uri);
  }

  function displayCovers(searchResults) {
    var result = [];

    for (var i = 0; i < searchResults.length; i++) {
      // Check so that we have not found enough tracks already
      if (result.length >= MAXIMUM_RESULT_SIZE) break;

      // A track is only a cover if it DOES NOT contain the current artist
      if (containsArtist(getCurrentArtistList(), searchResults[i].artists)) continue;

      // Make sure the track matches any of our cover tags
      // Actually, is this necessary?
      for (var j = 0; j < COVER_FILTER.length; j++) {
        if (searchResults[i].name.toLowerCase().indexOf(COVER_FILTER[j]) != -1) {
          result.push(searchResults[i]);
          break;
        }
      }
    }
    $("#throbber_cover").hide(); // remove spinner

    if (result.length > 0) {
      var data = splitResultWithRespectToTags(result);
      loadCircleGraph(formatDataForGraph(data, "cover"), "#graphCover", pickedSongFromGraph);
    } else noSamplesCover();
  }

  function displayRemixes(searchResults) {
    var result = [];

    for (var i = 0; i < searchResults.length; i++) {
      // Check so that we have not found enough tracks already
      if (result.length >= MAXIMUM_RESULT_SIZE) break;

      // A track is only a remix if it contains the current artist as one of the artists
      if (!containsArtist(getCurrentArtistList(), searchResults[i].artists)) continue;
      result.push(searchResults[i]);
    }
    $("#throbber_remix").hide(); // remove spinner

    if (result.length > 0) {
      var data = splitResultWithRespectToTags(result);
      loadCircleGraph(formatDataForGraph(data, "remix"), "#graphRemix", pickedSongFromGraph);
    } else noSamplesRemix();
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

    // Show loading indicator
    $("#throbber_samples").show();

    //Make this smarter
    updateTrackHeader();

    var currentTrack = getCurrentTrack();
    if (currentTrack === null) return; // no track playing

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
    // Hide loading indicator
    $("#throbber_samples").hide();

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
    var currentArtistListURI = [];
    for (var i = 0; i < currentArtistList.length; i++)
    currentArtistListURI.push(currentArtistList[i].uri);
    return currentArtistListURI;
  }

  function getCurrentArtistList() {
    return player.track.artists;
  }

  function getCurrentTrackHeader() {
    var currentTrack = getCurrentTrack();
    if (currentTrack === null || currentTrack.isAd === true) {
      return false;
    } else {
      var currentTrackURI = getCurrentTrackURI();
      //var trackheaderHTML = "♫ " + "<a href='" + root + currentTrackURI + "'>" + currentTrack + "</a><div id='artist" + i.toString() + "'></div>";
      // no link
      var trackheaderHTML = "♫ " + currentTrack + "<div id='artist" + i.toString() + "'></div>";
      return trackheaderHTML;
    }
  }

  function initCarousels() {
    $(".carouselContent").each(function() {
      $(this).carouFredSel({
        direction: "up",
        height: $("#wrapper").height(),
        width: 150,
        items: {
          start: (collabPlaylist !== null) ? Math.floor(Math.random() * collabPlaylist.length) : 0, // start carousel at random item
          visible: {
            min: 3,
            max: 10
          },
          height: "auto",
          width: 150
        },
        scroll: {
          items: 1,
          easing: "swing",
          pauseOnHover: true
        }
      });
      // Say that we should play song and refresh ui when an image in the carousel is clicked on
      $("#" + $(this).attr("id").toString() + " img").click(function() {
        player.play($(this).attr("alt"));
        refreshInterface();
      });
    });
  }

  function updateRemix() {
    $("#throbber_remix").show();
    animateOutGraph("#graphRemix", function() {
      if (updateTrackHeaderRemix()) searchSpotify(displayRemixes);
      else noSamplesRemix();
    });
  }

  function updateCover() {
    $("#throbber_cover").show();
    animateOutGraph("#graphCover", function() {
      if (updateTrackHeaderCover()) searchSpotify(displayCovers);
      else noSamplesCover();
    });
  }

  function updateTrackHeader() {
    var trackHeader = getCurrentTrackHeader();
    if (!trackHeader) return false;
    $("#trackHeader").html(trackHeader);
    return true;
  }

  function updateTrackHeaderRemix() {
    var trackHeader = getCurrentTrackHeader();
    if (!trackHeader) return false;
    $("#trackHeaderRemix").html(trackHeader);
    return true;
  }

  function updateTrackHeaderCover() {
    var trackHeader = getCurrentTrackHeader();
    if (!trackHeader) return false;
    $("#trackHeaderCover").html(trackHeader);
    return true;
  }

  function updateArtistHeader() {
    var artistList = getCurrentArtistList();
    var artistHeaderList = $("#artistHeaderList");
    for (var i = 0; i < artistList.length; i++) {
      //artistHeaderList.append('<div class="sampleHeader"><a href="' + root + artistList[i].uri + '">' + artistList[i].name + '</a></div><div id="artist' + i.toString() + '"></div>');
      artistHeaderList.append('<div class="sampleHeader">' + artistList[i].name + '</div><div id="artist' + i.toString() + '"></div>');
    }
  }

  function noSamples() {
    $("#noSamples").html("<error> No samples found! </error>");
  }

  function noSamplesRemix() {
    $("#throbber_remix").hide();
    $("#trackHeaderRemix").append("<br /> No remixes found! :(");
  }

  function noSamplesCover() {
    $("#throbber_cover").hide();
    $("#trackHeaderCover").append("<br /> No covers found! :(");
  }

  function consolify() {
    $("#console").html("Track now playing is " + getCurrentTrack());
    $("#console").append("Artists now playing are " + getCurrentArtistList());
  }
}