

// var initTime = ISODateString(new Date());
// var dawn = (new Date()).getTime();

var MAX_NBR_REMIX_RESULT = 15;

sp = getSpotifyApi(1);
window.onload = function() {
    var models = sp.require('sp://import/scripts/api/models');
    var views = sp.require('sp://import/scripts/api/views');
    var player = models.player;
    var library = models.library;
    var application = models.application;
    var root = 'spotify:app:'+window.location.hostname + ":";
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
                   if(event.data.curtrack) {
                   console.log("CurTrack");
                   // clearTracks();
                   // updateTracks();
                   }
                   
                   });
    
    
    //Handle Arguments
    application.observe(models.EVENT.ARGUMENTSCHANGED, handleArgs);
    
    // Handle items 'dropped' on your icon
    application.observe(models.EVENT.LINKSCHANGED, handleLinks);
    
    
    function handleArgs()
    {
        var args = models.application.arguments;
        console.log(args);
        $.each(args,function(i,arg){ args[i] = decodeURI(arg.decodeForText()); });  //decode crazy swede characters
        args = $.grep(args,function(n){ return(n); }); // remove empty
    }
    
    function handleLinks(){
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
                             (function(data)
                              {
                              // console.log("Sending data");
                              // console.log(data);
                              $.ajax({
                                     type: "PUT",
                                     url: 'http://samplify.herokuapp.com/add',
                                     data: data,
                                     error: function(e){
                                     console.log("Error Submitting, try again!");
                                     console.log(e);
                                     },
                                     success: function(e){
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
    
    function samples_drop(){
        
        //Why do this?
        $.event.props.push('dataTransfer');
        
        $('#drop_box_sampling')
        .live( 'dragenter', function( e ) {
              // console.log('Entered');
              $(this).addClass('over');
              // e.dataTransfer.setData('text/html', this.innerHTML);
              e.dataTransfer.effectAllowed = 'copy';
              })
        .live( 'dragleave', function( e ) {
              // $(this).removeClass('over');
              console.log('Leaving');
              // $(this).removeClass('hovering');
              })
        .live( 'dragover', function( e ) {
              // console.log('Dragging over');
              $(this).addClass('over');
              e.preventDefault();
              // e.dataTransfer.dropEffect = 'copy';
              // $(this).addClass('hovering');
              
              })
        .live( 'drop', function( e ) {
              
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
        .live( 'dragenter', function( e ) {
              // console.log('Entered');
              $(this).addClass('over');
              // e.dataTransfer.setData('text/html', this.innerHTML);
              e.dataTransfer.effectAllowed = 'copy';
              })
        .live( 'dragleave', function( e ) {
              // $(this).removeClass('over');
              console.log('Leaving');
              // $(this).removeClass('hovering');
              })
        .live( 'dragover', function( e ) {
              // console.log('Dragging over');
              $(this).addClass('over');
              e.preventDefault();
              // e.dataTransfer.dropEffect = 'copy';
              // $(this).addClass('hovering');
              
              })
        .live( 'drop', function( e ) {
              
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
    
    
    function clearTracks(){
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
        for (i=0;i<sections.length;i++){
            sections[i].style.display = 'none';
        }
        current.style.display = 'block';
    }
    
    // Searches for a given string and displays a playlist with the result
    // We want to search both the spotify catalog and our cached
    // database for remixes. Since we do not know if we will get any
    // results back and since both searches are asynchronus it requires
    // some fiddling with the divs in order to display correctly.    
    function searchAndDisplay(title, searchPhrase, dbResult){
        
        var searchString = "\"" + getCurrentTrackName() + "\" AND " + searchPhrase;
        
        var playlistArt = new views.Player();
        var tempPlaylist = new models.Playlist();
        var playlistList = new views.List(tempPlaylist);
        playlistArt.context = tempPlaylist;
        
        var resultsDiv = $("<div></div>").addClass("remixResult");
        var resultsPlayer = $("<div></div>").addClass("remixPlayer");
                         
        resultsDiv.append("<h2>" + title + "</h2>");
        resultsDiv.append(resultsPlayer);
        
        // Go through dbResult to see if any results in our database
        // matches the current category
        var count = dbResult.samples.length;
        for(var i=0; i<count;i++)
        {
            var currentResult = dbResult.samples[i];
            var currentResultTrack = models.Track.fromURI(currentResult.track2);
            
            // Make sure the result is the right kind of sample
            // and that it matches the current category
            if ( (currentResult.relationship.kind == "Remix" ||
                  currentResult.relationship.kind == "Cover Version (Remake)") &&
                (currentResultTrack.name.search(searchPhrase) != -1 || currentResultTrack.album.search(searchPhrase) != -1 || currentResultTrack.artists[0].search(searchPhrase) != -1 ))
            {
                tempPlaylist.add(currentResultTrack);
                console.log("Added remix track from local database");
            }
        }
        
        if (tempPlaylist.length > 0)
        {
            playlistArt.track = tempPlaylist.get(0);
            resultsPlayer.append(playlistArt.node);
            resultsDiv.append(playlistList.node);
        }else{
            resultsDiv.append("<div>No tracks for this type of remix</div>");
        }
        
        // Search spotify catalog for remixes (step 2)
        var search = new models.Search(searchString);
        search.pageSize = 20;
        search.searchPlaylists = false;
        search.observe(models.EVENT.CHANGE,
                       function() {
                       
                       // Add header
                       resultsDiv.empty();
                       resultsDiv.append("<h2>" + title + "</h2>");
                       resultsDiv.append(resultsPlayer);
                       
                       // If we have any search results
                       if(search.tracks.length)
                       {
                       $.each(search.tracks,function(index,track)
                              {
                                if (index <= MAX_NBR_REMIX_RESULT)
                                    tempPlaylist.add(models.Track.fromURI(track.uri));
                              });
                       
                            playlistArt.track = tempPlaylist.get(0);
                            resultsPlayer.append(playlistArt.node);
                            resultsDiv.append(playlistList.node);
                       } else {
                            resultsDiv.append("<div>No tracks for this type of remix</div>");
                       }
                       });
        search.appendNext(); // perform search
        $("#search-results").append(resultsDiv);
    }
    
    function searchForRemixes()
    {
        $("#search-results").empty();
        
        // Search our database for remixes (only once and then pass the result as a parameter to the filter function
        var currentTrackURI = getCurrentTrackURI();
        $.getJSON(getSampledURLForTrack(currentTrackURI.toString()),function(result){
                  searchAndDisplay("Instrumental/Karaoke", "instrumental", result);
                  searchAndDisplay("Dubstep", "dubstep", result);
                  searchAndDisplay("Electronic", "electronic", result);
                  searchAndDisplay("Country", "country", result);
                  searchAndDisplay("Acoustic", "acoustic", result);
                  });
    }
    
    function updateTracksRemix(){
        updateTrackHeader();
        var currentTrack = getCurrentTrack();
        if (currentTrack == null)
        {
            noSamples();
            return; // no track playing
        }
        // Perform search of current track
        searchForRemixes();
    }
    
    function getSampledURLForTrack(track)
    {
        return (server + "track/sampled?id=" + track);
    }
    
    function getSamplingURLForTrack(track)
    {
        return (server + "track/sampling?id=" + track);
    }
    function getSampledURLForArtist(artist)
    {
        return (server + "artist/sampled?id=" + artist);
    }
    
    function getSamplingURLForArtist(artist)
    {
        return (server + "artist/sampling?id=" + artist);
    }
    
    
    function updateTracks(){
        
        //Make this smarter
        updateTrackHeader();
        
        var currentTrack = getCurrentTrack();
        if (currentTrack == null)
            return; // no track playing
        
        var currentTrackURI = getCurrentTrackURI();
        $.getJSON(getSampledURLForTrack(currentTrackURI.toString()),function(result){
                  var count = result.samples.length;
                  // console.log("Count of Sampled Tracks are " + count);
                  for(var i=0; i<count;i++)
                  {
                  updateTrackSample(result.samples[i]);
                  }
                  });
        
        // Do we really want to search both sampled and sampling?
        /*  $.getJSON(getSamplingURLForTrack(currentTrackURI.toString()),
         function(result){
         var count = result.samples.length;
         // console.log("Count of Sampling Tracks are " + count);
         for(var i=0; i<count;i++)
         {
         updatedTracks = false;
         updateTrackSample(result.samples[i]);
         }
         });*/
        
        updateArtistHeader();
        updateArtists();
    }
    
    function updateArtists(){
        
        var artistList = getCurrentArtistList();
        
        var updatedArtists;
        for(var j=0;j< artistList.length; j++)
        {
            //Make calls with closure, how?
            (function(uri,j)
             {
             $.getJSON(getSampledURLForArtist(uri),
                       function(result){
                       for(var i=0;i<result.samples.length;i++){
                       // console.log("We are being called!");
                       updatedArtists = false;
                       updateArtistSample(result.samples[i],j);
                       }
                       });
             
             /*   $.getJSON(getSamplingURLForArtist(uri),
              function(result){
              for(var i=0;i<result.samples.length;i++){
              // console.log("We are being called too!");
              updatedArtists = false;
              updateArtistSample(result.samples[i],j);
              }
              }); */
             })(artistList[j].uri,j);
            
        }
        // console.log(updatedArtists);
        // if(!updatedArtists){
        // noSamples();
        // }
    }
    function addLeadingZero(number) {
        return ((parseInt(number) < 10) ? "0" : "") + parseInt(number);
    }
    
    function minutesFromSeconds(time)
    {
        var minutes = Math.floor(time/60);
        var seconds = time%60;
        var res = addLeadingZero(minutes.toString()) + ":" + addLeadingZero(seconds.toString());
        return res;
    }
    
    function setupSampleContent(sample)
    {
        //Create Sample Context
        var sampling_track = models.Track.fromURI(sample.track1 + "#"  + minutesFromSeconds(sample.time1) );
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
        relnDiv.append((!sample.relationship.partsampled? "" : sample.relationship.partsampled) + "</br>" + sample.relationship.kind);
        // Uppppppddddddaaaaaattttteeeeee!
        
        var outerDiv = $("<div></div>").addClass("sample");
        outerDiv.append(samplingDiv);
        outerDiv.append(relnDiv);
        outerDiv.append(sampledDiv);
        return outerDiv;
    }
    
    // Updates the sample, sampling and the relationship, samples from artists
    function updateArtistSample(sample,id){
        
        // console.log("Getting artist samples");
        var tag = "#artist" + (id).toString();
        // console.log("Tag is " + tag);
        var artistSamplesHTML = $(tag);
        artistSamplesHTML.append(setupSampleContent(sample));
    }
    
    
    // Update the sample, sampling and the relationship, samples of track
    function updateTrackSample(sample){
        
        var trackSamplesHTML = $("#trackSamples");
        trackSamplesHTML.append(setupSampleContent(sample));
    }
    
    function getCurrentTrackURI(){
        // Get the track that is currently playing
        var currentTrack = player.track;
        var currentTrackURI = player.track.uri;
        //var currentArtistList = player.track.artists;
        //var currentAlbum = player.track.album.name;
        //var currentAlbumURI = player.track.album.uri;
        
        return currentTrackURI;
    }
    
    function getCurrentTrack(){
        // Get the track that is currently playing
        var currentTrack = player.track;
        //var currentTrackURI = player.track.uri;
        //var currentArtistList = player.track.artists;
        //var currentAlbum = player.track.album.name;
        //var currentAlbumURI = player.track.album.uri;
        return currentTrack;
    }
    
    function getCurrentTrackName(){
        // Get the track that is currently playing
        var currentTrack = player.track;
        var currentTrackName = currentTrack.name;
        //var currentTrackURI = player.track.uri;
        //var currentArtistList = player.track.artists;
        //var currentAlbum = player.track.album.name;
        //var currentAlbumURI = player.track.album.uri;
        return currentTrackName;
    }
    
    function getCurrentArtistListURI(){
        var currentArtistList = player.track.artists;
        var currentArtistListURI = []
        for(var i=0; i< currentArtistList.length; i++)
            currentArtistListURI.push(currentArtistList[i].uri);
        return currentArtistListURI;
    }
    
    function getCurrentArtistList(){
        return player.track.artists;
    }
    
    function updateTrackHeader()
    {
        var currentTrack = getCurrentTrack();
        if (currentTrack == null) {
            console.log("No track playing!");
            return false;
        }
        else {
            var currentTrackURI = getCurrentTrackURI();
            var trackheaderHTML = "♫ " + "<a href='" + root + currentTrackURI + "'>" + currentTrack + "</a><div id='artist" + i.toString() + "'></div>";
            $("#trackHeader").html(trackheaderHTML);
            $("#trackHeaderRemix").html(trackheaderHTML);
            return true;
        }
    }
    
    function updateArtistHeader()
    {
        var artistList = getCurrentArtistList();
        var artistHeaderList = $("#artistHeaderList");
        for(var i=0;i<artistList.length; i++)
        {
            artistHeaderList.append('<div class="header"><a href="' + root + artistList[i].uri + '">' + artistList[i].name + '</a></div><div id="artist' + i.toString() + '"></div>');
            // artistHeaderList.append('<div class="header">'  + artistList[i].name + '</div><div id="artist' + i.toString() + '"></div>');
            
        }
    }
    
    function noSamples()
    {
        var errorHTML = "<error> No Samples found! </error>";
        var noSamples = $("#noSamples");
        noSamples.html(errorHTML);
        var noSamplesRemix = $("#noSamplesRemix");
        noSamplesRemix.html(errorHTML);
    }
    
    function consolify(){
        
        $("#console").html("Track now playing is " + getCurrentTrack());
        $("#console").append("Artists now playing are " + getCurrentArtistList());
    }
}
