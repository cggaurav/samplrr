require(['$api/models', '$api/search#Search', '$views/image#Image', '$views/throbber#Throbber'],

function(models, Search, Image, Throbber) {

  // When application has loaded, run tabs function
  models.application.load('arguments').done(tabs);

  // When arguments change, run tabs function
  models.application.addEventListener('arguments', tabs);

  var root = 'spotify:app:' + window.location.hostname + ":";
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
  var throbber_samples = Throbber.forElement($("#index")[0]);
  throbber_samples.setPosition($("#wrapper").width() / 2-40, $("#wrapper").height() / 2-40);
  var throbber_remix = Throbber.forElement($("#remix")[0]);
  throbber_remix.setPosition($("#wrapper").width() / 2-40, $("#wrapper").height() / 2-40);
  var throbber_cover = Throbber.forElement($("#cover")[0]);
  throbber_cover.setPosition($("#wrapper").width() / 2-40, $("#wrapper").height() / 2-40);
  throbber_samples.showContent();
  throbber_remix.showContent();
  throbber_cover.showContent();

  // Called when a new song starts playing. If the global flag is set to true then we
  // refresh the UI. Is this the best solution?
  models.player.addEventListener('change', function() {
    if (refreshFlag === true) {
      refreshFlag = false;
      refreshInterface();
    }
  });

  // Setup refresh button
  require('$views/buttons', function(buttons) {
    var refreshButton = buttons.Button.withLabel('Refresh');
    $('#refreshButton').append(refreshButton.node);
  });

  //First time use
  refreshInterface();

  // Load data into carousel playlists from collaboration playlists
  loadCarouselPlaylists();

  function tabs() {
    var args = models.application.arguments;
    var current = $('#' + args[0]); // current tab
    $(".section").each(function() {
      $(this).hide(); // hide all tabs...
    });
    current.show(); // ... and show the current one
    initAllCarousels();
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

  $("#refreshButton").click(function() {
    refreshInterface();
  });

  function doneResizing() {
    initAllCarousels();
  }
  // Called when the window is 'fully'resized
  $(window).resize(function() {
    clearTimeout(windowResize);
    windowResize = setTimeout(doneResizing, 1000);
  });


  function addPlaylistToCarousel(playlist, divName) {
    playlist.tracks.snapshot().done(function(snapshot) {
      for (var i = 0; i < snapshot.length; i++) {
        var collabTrack = snapshot.get(i);
        if (collabTrack.album === null) continue; // sometimes bogus tracks appear in the playlist

        // Do not add the track if it is not playable
        if (collabTrack.playable === false) continue;

        // Load album name
        (function(curTrack, j) {
          models.Album.fromURI(curTrack.album.uri).load('name').done(function(album) {
            // Load image for current track to place in carousel
            var image = Image.forTrack(curTrack, {
              width: 100,
              height: 100,
              placeholder: "track",
              style: "plain"
            });

            // Add attributes in order to be able to interact with it later
            $(image.node).attr('uri', curTrack.uri);
            $(image.node).attr('name', curTrack.name);
            $(image.node).attr('artist', getArtistString(curTrack.artists));
            $(image.node).attr('album', album.name);
            $(divName).trigger("insertItem", [image.node, 0, true, 0]);
          });
        })(collabTrack, i);
      }
    }).fail(function() {
      console.error('Error retrieving snapshot');
    });
  }

  function loadCarouselPlaylists() {
    models.Playlist.fromURI(SAMPLIFY_COLLAB_PLAYLIST_SAMPLES).load('tracks').done(function(playlist) {
      addPlaylistToCarousel(playlist, "#carouselSample");
      initCarousel("#carouselSample");
    }).fail(function() {
      console.error("Error retrieving sample carousel playlist");
    });
    models.Playlist.fromURI(SAMPLIFY_COLLAB_PLAYLIST_REMIXES).load('tracks').done(function(playlist) {
      addPlaylistToCarousel(playlist, "#carouselRemix");
      initCarousel("#carouselRemix");
    }).fail(function() {
      console.error("Error retrieving sample carousel playlist");
    });
    models.Playlist.fromURI(SAMPLIFY_COLLAB_PLAYLIST_COVERS).load('tracks').done(function(playlist) {
      addPlaylistToCarousel(playlist, "#carouselCover");
      initCarousel("#carouselCover");
    }).fail(function() {
      console.error("Error retrieving sample carousel playlist");
    });
  }

  function initAllCarousels() {
    $(".carouselContent").each(function() {
      initCarousel('#' + $(this).attr("id").toString());
    });
  }

  function initCarousel(divName) {
    $(divName).carouFredSel({
      direction: "up",
      height: $("#wrapper").height(),
      width: 150,
      items: {
        //start: 0,
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
    $(divName + " .sp-image").click(function() {
      models.player.playTrack(models.Track.fromURI($(this).attr("uri")));
      refreshFlag = true; // tells the ui to refresh when the new song has loaded
    });

    // create tooltip
    var tooltip = CustomTooltip(divName.substring(1) + "tooltip", 300,
      '#' + $(divName).closest('div[class^="section"]').attr('id').toString()); // insert tooltip in section
    $(divName + " .sp-image").mouseover(function(event) {
      var title = $(this).attr("name");
      var artist = $(this).attr("artist");
      var album = $(this).attr("album");

      var tooltipHTML = "<span class=\"title\">Title </span>" + title +
        "<br /><span class=\"title\">Artist </span>" + artist +
        "<br /><span class=\"title\">Album </span>" + album;
      tooltip.showTooltip(tooltipHTML, event);
    });
    $(divName + " .sp-image").mouseout(function() {
      tooltip.hideTooltip();
    });
    $(divName + " .sp-image").mousemove(function(event) {
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
      $.getJSON(getSampleURLForTrack(currentTrackURI), function(result) {
        $("#trackSamples").empty(); // clear current context
        var count = result.samples.length;

        if (count > 0) {
          for (var i = 0; i < count; i++) {
            $("#trackSamples").append(setupSampleContent(result.samples[i]));
          }
        } else noSamplesForTrack();
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
        $.getJSON(getSampleURLForArtist(uri), function(result) {

          var count = result.samples.length;
          // in case this header was created before, remove it and add the new result (might lead to sync issues otherwise)
          $('#artist' + j).remove();
          if (count > 0) {
            // Setup artist sample list
            var currentArtistHTML = $("<div></div>").addClass("sampleHeader").attr('id', 'artist' + j);
            currentArtistHTML.append(name);

            for (var i = 0; i < count; i++) {
              currentArtistHTML.append(setupSampleContent(result.samples[i]));
            }
            $("#artistHeaderList").append(currentArtistHTML);
          }
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

    var sampling_image = Image.forTrack(sampling_track, {
      player: true,
      placeholder: "track",
      style: "embossed"
    });
    var sampled_image = Image.forTrack(sampled_track, {
      player: true,
      placeholder: "track",
      style: "embossed"
    });

    var samplingDiv = $("<div></div>").addClass("sampled");
    samplingDiv.append(sampling_image.node);

    var sampledDiv = $("<div></div>").addClass("sampling");
    sampledDiv.append(sampled_image.node);

    var relnDiv = $("<div></div>").addClass("relationship");
    if (!sample.relationship.partSampled) relnDiv.append("<p> is a " + sample.relationship.kind.toLowerCase() + " of </p>");
    else relnDiv.append("<p> is a " + sample.relationship.kind.toLowerCase() + ' with </br> ' + sample.relationship.partSampled + " of </p>");

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
  }

  function noSamplesForTrack() {
    throbber_samples.hide();
    $("#trackSamples").addClass("sampleHeader").append("No samples for this track found!");
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
      var result = []; // the results of the search

      var search = Search.search(searchString);
      search.tracks.snapshot(0, SEARCH_PAGE_SIZE).done(function(snapshot) {

        var results = snapshot.toArray();
        var numberOfAlbumsFetched = 0;

        // For some unknown reason is album names not included in the resulting tracks
        // Load them separetly here.
        for (var i = 0; i < results.length; i++) {
          (function(j) {
            models.Album.fromURI(results[j].album.uri).load('name').done(function(album) {
              results[j].album.name = album.name;
              if (++numberOfAlbumsFetched == results.length) {
                // return results when finished
                callback(sortTracksByPopularity(results));
              }
            }).fail(function() {
              console.error("Error loading album name");
              if (++numberOfAlbumsFetched == results.length) {
                // return results when finished
                callback(sortTracksByPopularity(results));
              }
            });
          })(i);
        }
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
    throbber_remix.showContent();
    animateOutGraph("#graphRemix", function() {
      updateTrackHeader("#trackHeaderRemix");
      searchSpotify(displayRemixes);
    });
  }

  function updateCover() {
    throbber_cover.show();
    throbber_cover.showContent();
    animateOutGraph("#graphCover", function() {
      updateTrackHeader("#trackHeaderCover");
      searchSpotify(displayCovers);
    });
  }

  function noSamplesRemix() {
    throbber_remix.hide();
    $("#trackHeaderRemix").append("<br /> No remixes found! :(");
  }

  function noSamplesCover() {
    throbber_cover.hide();
    $("#trackHeaderCover").append("<br /> No covers found! :(");
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

      var trackheaderHTML = "♫ " + currentTrackName + " by " + getArtistString(currentArtistList);
      $(trackHeaderDiv).html(trackheaderHTML);
    }).fail(function() {
      console.error("Error retrieving current track.");
    });
  }
});