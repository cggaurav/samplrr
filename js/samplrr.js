require(['$api/models', '$api/search#Search', '$views/image#Image', '$views/throbber#Throbber', '$api/toplists#Toplist'],

function(models, Search, Image, Throbber, Toplist) {

  // When application has loaded, run tabs function
  models.application.load('arguments').done(tabs);

  // When arguments change, run tabs function
  models.application.addEventListener('arguments', tabs);

  var root = 'spotify:app:samplrr:';

  // var server = 'http://samplify.herokuapp.com/';
  var server = 'http://samplifybackend.herokuapp.com/';

  var SEARCH_PAGE_SIZE = 200; // The maximum number of search results to consider in the spotify database
  var MAXIMUM_RESULT_SIZE = 25; // The maximum number of songs to show in our cover and remix graphs

  // These tags identify what is a cover. A cover must contain at least one of these keywords.
  var COVER_FILTER = ["cover", "made famous by", "tribute", "instrumental", "karaoke", "in the style of", "version", "originally by", "originally performed"];

  var SAMPLIFY_COLLAB_PLAYLIST_SAMPLES = "spotify:user:cggaurav:playlist:6RR4sZhswpFYkhgCxm5HfC";
  var SAMPLIFY_COLLAB_PLAYLIST_REMIXES = "spotify:user:faximan:playlist:3WmosOs2FKQgafFv5pQrrT";
  var SAMPLIFY_COLLAB_PLAYLIST_COVERS = "spotify:user:faximan:playlist:1uZXfGQXYUefaWCuS6qnRd";
  var windowResize = false;
  var refreshFlag = false; // is set when the interface is supposed to be reset as soon
  // as the track has loaded. Can this be done without a global variable?

  // Setup throbbers in the middle of the app window (a throbber is 80x80 px)
  var throbber_samples = Throbber.forElement($("#sample")[0]);
  throbber_samples.setPosition($("#wrapper").width() / 2 - 40, $("#wrapper").height() / 2 - 40);
  var throbber_remix = Throbber.forElement($("#remix")[0]);
  throbber_remix.setPosition($("#wrapper").width() / 2 - 40, $("#wrapper").height() / 2 - 40);
  var throbber_cover = Throbber.forElement($("#cover")[0]);
  throbber_cover.setPosition($("#wrapper").width() / 2 - 40, $("#wrapper").height() / 2 - 40);
  throbber_samples.showContent();
  throbber_remix.showContent();
  throbber_cover.showContent();

  // Carousels on the home page
  var carousel_sample = null, carousel_remix = null, carousel_cover = null;

  // Called when a new song starts playing. If the global flag is set to true then we
  // refresh the UI. Is this the best solution?
  models.player.addEventListener('change', function() {
    if (refreshFlag === true) {
      refreshFlag = false;
      refreshInterface();
    }
  });

  models.session.addEventListener('change', function() {
    updateOfflineStatus();
  });

  function updateOfflineStatus() {
    if (models.session.online === false) {
      showOfflineError();
    } else {
      hideOfflineError();
    }
  }

  // Setup refresh button
  require('$views/buttons', function(buttons) {
    var refreshButton = buttons.Button.withLabel('Refresh');
    $('#refresh').append(refreshButton.node);
  });

  updateOfflineStatus();

  //First time use
  refreshInterface();

  // Load data into carousel playlists from collaboration playlists
  loadCarouselPlaylists();

  function tabs() {
    if (models.session.online) { // this should only work when we are online
      var args = models.application.arguments;
      var current = $('#' + args[0]); // current tab
      $(".section").each(function() {
        $(this).hide(); // hide all tabs...
      });
      current.show(); // ... and show the current one

      // Only display twitter button on the front page
      if (args[0] == 'home') {
  //      $("#twitter").show();
        $("#refresh").hide();
      } else {
  //      $("#twitter").hide();
        $("#refresh").show();
      }
    }
  }

  function refreshInterface() {
    // Load current track
    models.player.load('track').done(function() {
      if (models.player.track === null) {
        noTrackPlaying();
      } else {
        // Only update the views if a track is playing right now
        clearSamples();
        updateSamples();
        updateRemix();
        updateCover();
      }
    });
  }

  function showOfflineError() {
    $(".section").each(function() {
      $(this).hide(); // hide all tabs...
    });
    $("#refresh").hide(); // hide refresh button in offline mode
    $("#offlineError").show();
  }

  function hideOfflineError() {
    tabs(); // makes us show the correct tab again
    if (refreshFlag === true) {
      refreshFlag = false;
      refreshInterface();
    }
    $("#offlineError").hide();
  }

  $("#refresh").click(function() {
    refreshInterface();
  });

  function doneResizing() {}

  // Called when the window is 'fully'resized
  $(window).resize(function() {
    clearTimeout(windowResize);
    windowResize = setTimeout(doneResizing, 500);
  });

  // Loads the information for a track shown in the tooltip for that track (async)

  function loadTooltipForPlayer(player, uri) {
    models.Track.fromURI(uri).load(['name', 'artists', 'album']).done(function(track) {
      $(player.node).attr('uri', track.uri);
      $(player.node).attr('name', track.name);
      $(player.node).attr('artist', getArtistString(track.artists, false));
      models.Album.fromURI(track.album.uri).load('name').done(function(album) {
        $(player.node).attr('album', album ? album.name : "");
      });
    });
  }

  // Adds a track to the carousel specified with divName. Remeber to init the carousel if it is not done.
  function addTrackToCarousel(track, divName)
  {
      if (track.album === null) return; // sometimes bogus tracks appear in the playlist
      if (track.playable === false) return; // Do not add the track if it is not playable

      var image = Image.forTrack(track, {
          width: 150,
          height: 150,
          placeholder: "track",
          style: "plain",
          player: true
        });
      loadTooltipForPlayer(image, track.uri);
      $(divName).append(image.node);
  }

  function addPlaylistToCarousel(playlist, divName) {
    playlist.tracks.snapshot().done(function(snapshot) {
      for (var i = 0; i < snapshot.length; i++) {
        var collabTrack = snapshot.get(i);
        addTrackToCarousel(collabTrack, divName);
      }
      reloadCarousel(divName);
    }).fail(function() {
      console.error('Error retrieving snapshot');
    });
  }

  function loadToplistTracksIntoCarousels(divName) {
    // Load toplist of track for the current user
    var toplist = Toplist.forCurrentUser();
    toplist.tracks.snapshot().done(function(snapshot) {
      for (var i = 0; i < snapshot.length; i++) {
        var track = snapshot.get(i);
        addTrackToCarousel(track, divName);
      }
      reloadCarousel(divName);
    }).fail(function() {
      console.error("Error retrieving toplist snapshot");
    });
  }

  function loadCarouselPlaylists() {
    // We want to populate the carousels with relevant matches from the current users toplist
    // TODO: Only add relevant songs
    loadToplistTracksIntoCarousels("#carousel-remix", carousel_remix);
    loadToplistTracksIntoCarousels("#carousel-sample", carousel_cover);
    loadToplistTracksIntoCarousels("#carousel-cover", carousel_sample);

    // Fill up with "safe songs" from our own playlist
    models.Playlist.fromURI(SAMPLIFY_COLLAB_PLAYLIST_SAMPLES).load('tracks').done(function(playlist) {
      addPlaylistToCarousel(playlist, "#carousel-sample");
    }).fail(function() {
      console.error("Error retrieving sample carousel playlist");
    });
    models.Playlist.fromURI(SAMPLIFY_COLLAB_PLAYLIST_REMIXES).load('tracks').done(function(playlist) {
      addPlaylistToCarousel(playlist, "#carousel-remix");
    }).fail(function() {
      console.error("Error retrieving sample carousel playlist");
    });
    models.Playlist.fromURI(SAMPLIFY_COLLAB_PLAYLIST_COVERS).load('tracks').done(function(playlist) {
      addPlaylistToCarousel(playlist, "#carousel-cover");
    }).fail(function() {
      console.error("Error retrieving sample carousel playlist");
    });
  }

  function reloadCarousel(divName) {
    if (divName == "#carousel-remix") {
      if (carousel_remix !== null) carousel_remix.destroySlider();
      carousel_remix = initCarousel("#carousel-remix");
    } else if (divName == "#carousel-sample") {
      if (carousel_sample !== null) carousel_sample.destroySlider();
      carousel_sample = initCarousel("#carousel-sample");
    } else if (divName == "#carousel-cover") {
      if (carousel_cover !== null) carousel_cover.destroySlider();
      carousel_cover = initCarousel("#carousel-cover");
    }
  }

  function initCarousel(divName) {
    var slider = $(divName).bxSlider({
      maxSlides: 30,
      slideWidth: 150,
      slideHeight: 150,
      slideMargin: 5,
      pager: true,
      infiniteLoop: false,
      hideControlOnEnd: true
    });

    // Say that we should play song and refresh ui when an image in the carousel is clicked on
    $(divName + " .sp-image").click(function() {
      refreshFlag = true; // tells the ui to refresh when the new song has loaded
      models.player.playTrack(models.Track.fromURI($(this).attr("uri")));

      // Navigate to the corresponding tab
      var tabToNavigateTo;
      if (divName == "#carousel-remix") tabToNavigateTo = "remix";
      if (divName == "#carousel-cover") tabToNavigateTo = "cover";
      if (divName == "#carousel-sample") tabToNavigateTo = "sample";

      window.location = root + tabToNavigateTo; // navigate to new tab
    });
    setupTooltip();
    return slider;
  }

  // Makes sure every (currently loaded) player image has its corresponding tooltip

  function setupTooltip() {
    $(".sp-image").mouseover(function(event) {
      var title = $(this).attr("name");
      var artist = $(this).attr("artist");
      var album = $(this).attr("album");

      var tooltipHTML = "<span class='title'>Title </span>" + title +
        "<br /><span class='title'>Artist </span>" + artist +
        "<br /><span class='title'>Album </span>" + album;
      tooltip.showTooltip(tooltipHTML, event);
    });
    $(".sp-image").mouseout(function() {
      tooltip.hideTooltip();
    });
    $(".sp-image").mousemove(function(event) {
      tooltip.updatePosition(event);
    });
  }

  function getSampleURLForTrack(track) {
    return (server + "track?id=" + track);
  }

  function getSampleURLForArtist(artist) {
    return (server + "artist?id=" + artist);
  }

  function updateSamples() {
    // Show loading indicator
    throbber_samples.show();
    throbber_samples.showContent();

    updateTrackHeader("#trackHeaderSamples");

    models.player.load('track').done(function() {
      var currentTrack = models.player.track;
      if (currentTrack === null || currentTrack.isAd === true) return null; // no track playing

      var currentTrackURI = currentTrack.uri;
      $.getJSON(getSampleURLForTrack(currentTrackURI)).done(function(result) {
        $("#trackSamples").empty(); // clear current context
        var count = result.samples.length;

        if (count > 0) {
          for (var i = 0; i < Math.min(MAXIMUM_RESULT_SIZE, count); i++) {
            $("#trackSamples").append(setupSampleContent(result.samples[i]));
          }
          setupTooltip();
        } else noSamplesForTrack();
      }).fail(function() {
        serverError("#noSamples");
      });
      updateSampleArtists();
    }).fail(function() {
      console.erorr("Error retrieving the current track");
    });
  }

  // track should already be loaded in updateSamples()

  function updateSampleArtists() {
    var currentTrack = models.player.track;
    if (currentTrack === null || currentTrack.isAd === true) return null; // no track playing
    var artistList = currentTrack.artists;

    for (var j = 0; j < artistList.length; j++) {
      (function(uri, name, j) {
        $.getJSON(getSampleURLForArtist(uri)).done(function(result) {
          var count = result.samples.length;
          // in case this header was created before, remove it and add the new result (might lead to sync issues otherwise)
          $('#artist' + j).remove();
          if (count > 0) {
            // Setup artist sample list
            var currentArtistDiv = $("<div></div>");
            var currentArtistHeader = $("<div></div>").addClass("sampleHeader").attr('id', 'artist' + j);
            currentArtistHeader.append("► " + "<a href='" + uri + "'>" + name + "</a>");
            currentArtistDiv.append(currentArtistHeader);

            for (var i = 0; i < Math.min(MAXIMUM_RESULT_SIZE, count); i++)
            currentArtistDiv.append(setupSampleContent(result.samples[i]));

            $("#artistHeaderList").append(currentArtistDiv);
            setupTooltip();
          }
        }).fail(function() {
          // Server error
          // We dont show anything here (nothing for this artist)
        });
      })(artistList[j].uri, artistList[j].name, j);
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

    // Hide loading indicator as soon as we have a sample to show
    throbber_samples.hide();

    // Get the tracks
    var sampling_track = models.Track.fromURI(sample.sampling_track);
    var sampled_track = models.Track.fromURI(sample.sampled_track);

    var playerOptions = {
      player: true,
      placeholder: "track",
      style: "embossed",
      width: 250,
      height: 250,
      link: "auto" // links image to track
    };

    var sampling_image = Image.forTrack(sampling_track, playerOptions);
    var sampled_image = Image.forTrack(sampled_track, playerOptions);
    loadTooltipForPlayer(sampling_image, sampling_track.uri);
    loadTooltipForPlayer(sampled_image, sampled_track.uri);

    var samplingDiv = $("<div></div>").addClass("sampled");
    samplingDiv.append(sampling_image.node);

    var sampledDiv = $("<div></div>").addClass("sampling");
    sampledDiv.append(sampled_image.node);

    var relnDiv = $("<div></div>").addClass("relationship");
    relnDiv.append("is a sample of");

    var outerDiv = $("<div></div>").addClass("sample");
    outerDiv.append(samplingDiv);
    outerDiv.append(relnDiv);
    outerDiv.append(sampledDiv);
    return outerDiv;
  }

  function clearSamples() {
    $("#trackSamples").empty();
    $("#trackHeaderSamples").empty();
    $("#artistHeaderList").empty();
    $("#noSamples").empty();
  }

  function noSamplesForTrack() {
    throbber_samples.hide();
    $("#noSamples").html("No samples were found for this track.");
  }

  // Called when we can not, for some reason, retrieve data from the server
  // we show an error message in the div with the given name

  function serverError(divName) {
    throbber_samples.hide();
    $(divName).html("The server is unavailable now. Please try again later.");
  }

  // Checks whether string s contains any of the tags in the given array
  // returns a boolean value

  function containsTag(s, arrayOfTags) {
    s = s.toLowerCase();
    for (var i = 0; i < arrayOfTags.length; i++) {
      if (s.indexOf(arrayOfTags[i]) != -1) return true;
    }
    return false;
  }

  function splitResultWithRespectToTags(tracks) {
    var result = [];
    for (var i = 0; i < TAGS.length; i++) {
      result[i] = [];
    }

    for (i = 0; i < tracks.length; i++) {
      var matchFound = false;
      for (var j = 0; j < TAGS.length - 1; j++) {
        // Check for match
        if (containsTag(tracks[i].name, TAGS[j][1]) || containsTag(tracks[i].album.name, TAGS[j][1])) {
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
        if (current[i].uri == match[j].uri) // match uri as they are unique for every artist
        return true;
      }
    }
    return false;
  }

  function searchSpotify(callback) {
    models.player.load('track').done(function() {
      if (models.player.track === null || models.player.track.isAd === true) return; // no track playing

      // Get the track name
      var currentTrackName = getCleanTrackName(models.player.track.name);
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
        models.Promise.join(promises)
          .always(function(albums) {
          for (var i = 0; i < results.length; i++)
          results[i].album.name = albums[i].name; // add the album name to the result tracks
          callback(sortTracksByPopularity(results)); // return the results sorted by popularity in the callback
        });
      }).fail(function() {
        console.error('Error retrieving snapshot');
      });
    }).fail(function() {
      console.error("Erorr retrieving current track.");
    });
  }

  // start playing the song that the user picked

  function pickedSongFromGraph(uri) {
    models.player.playTrack(models.Track.fromURI(uri));
  }

  function displayCovers(searchResults) {
    // Get current artist list
    models.player.load('track').done(function() {
      var result = [];

      for (var i = 0; i < searchResults.length; i++) {

        // Check so that we have not found enough tracks already
        if (result.length >= MAXIMUM_RESULT_SIZE) break;

        // A track is only a cover if it DOES NOT contain the current artist
        if (containsArtist(models.player.track.artists, searchResults[i].artists)) continue;

        // Make sure the track matches any of our cover tags
        // Actually, is this necessary?
        for (var j = 0; j < COVER_FILTER.length; j++) {
          if (searchResults[i].name.toLowerCase().indexOf(COVER_FILTER[j]) != -1) {
            result.push(searchResults[i]);
            break;
          }
        }
      }
      throbber_cover.hide(); // remove spinner

      if (result.length > 0) {
        var data = splitResultWithRespectToTags(result);
        loadCircleGraph(formatDataForGraph(data, "cover"), "#graphCover", pickedSongFromGraph);
      } else noSamplesCover();
    });
  }

  function displayRemixes(searchResults) {
    // Get current artist list
    models.player.load('track').done(function() {
      var result = [];

      for (var i = 0; i < searchResults.length; i++) {
        // Check so that we have not found enough tracks already
        if (result.length >= MAXIMUM_RESULT_SIZE) break;

        // A track is only a remix if it contains the current artist as one of the artists
        if (!containsArtist(models.player.track.artists, searchResults[i].artists)) continue;
        result.push(searchResults[i]);
      }
      throbber_remix.hide(); // remove spinner

      if (result.length > 0) {
        var data = splitResultWithRespectToTags(result);
        loadCircleGraph(formatDataForGraph(data, "remix"), "#graphRemix", pickedSongFromGraph);
      } else noSamplesRemix();
    });
  }

  function updateRemix() {
    throbber_remix.show();
    $("#noRemixes").empty();
    throbber_remix.showContent();
    animateOutGraph("#graphRemix", function() {
      updateTrackHeader("#trackHeaderRemix");
      searchSpotify(displayRemixes);
    });
  }

  function updateCover() {
    throbber_cover.show();
    $("#noCovers").empty();
    throbber_cover.showContent();
    animateOutGraph("#graphCover", function() {
      updateTrackHeader("#trackHeaderCover");
      searchSpotify(displayCovers);
    });
  }

  function noSamplesRemix() {
    throbber_remix.hide();
    $("#noRemixes").html("No remixes were found for this track.");
  }

  function noSamplesCover() {
    throbber_cover.hide();
    $("#noCovers").html("No covers were found for this track.");
  }

  function noTrackPlaying() {
    throbber_samples.hide();
    throbber_remix.hide();
    throbber_cover.hide();

    // Clear the sample tab. Cover and remixes are clered when the graph
    // "fades out"
    clearSamples();

    $(trackHeaderSamples).html("<br /> Play a track and hit refresh!");
    $(trackHeaderRemix).html("<br /> Play a track and hit refresh!");
    $(trackHeaderCover).html("<br /> Play a track and hit refresh!");
  }

  /* Heplper functions to get information about the current playing song */
  // remove unneccessary parts of the track name (if there are any)
  // This is to remove subtitles such as "Levels - Original Version" -> "Levels"

  function getCleanTrackName(trackName) {
    var indexOfSubtitle = trackName.indexOf("-");
    if (indexOfSubtitle != -1) trackName = trackName.substring(0, indexOfSubtitle);
    indexOfSubtitle = trackName.indexOf("(");
    if (indexOfSubtitle != -1) trackName = trackName.substring(0, indexOfSubtitle);
    return trackName;
  }

  function updateTrackHeader(trackHeaderDiv) {
    $(trackHeaderDiv).empty(); // clean this header
    models.player.load('track').done(function() {
      var currentTrack = models.player.track;
      if (currentTrack === null || currentTrack.isAd === true) return false;

      var currentTrackName = currentTrack.name;
      var currentArtistList = currentTrack.artists;

      var trackheaderHTML = "♫ " + "<a href='" + currentTrack.uri + "'>" + currentTrackName + "</a>" + " by " + getArtistString(currentArtistList, true);
      $(trackHeaderDiv).html(trackheaderHTML);
    }).fail(function() {
      console.error("Error retrieving current track.");
    });
  }
});