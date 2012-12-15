window.onload = function() {
    sp = getSpotifyApi(1);
    var models = sp.require('sp://import/scripts/api/models');
    var views = sp.require('sp://import/scripts/api/views');
    var player = models.player;
    var library = models.library;
    var application = models.application;


    //Data values
    var currentTrackSampled;

    // Handle tabs, do we need this?
    tabs();
    
    //First time use
    clearTracks();
    updateTracks();

    models.application.observe(models.EVENT.ARGUMENTSCHANGED, tabs);

    models.player.observe(models.EVENT.CHANGE, function(event) {
        console.log(event);
        if(event.data.curtrack) {
            console.log("curtrack Event");
            // clearTracks();
            // updateTracks();
        }
        if(event.data.playing){
            console.log("playing Event");
        }
    });


    $("#refresh").click(function() {
        clearTracks();
        updateTracks();
    });


    function clearTracks(){
        $("#trackSamples").empty();
        $("#trackHeader").empty();
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

    function updateTracks(){

        //Make this smarter
        updateTrackHeader();

        var currentTrackURI = getCurrentTrackURI();
        var tracksFound = "AMIFUCKINGSTUPID";
        // console.log(currentTrackURI);
        $.getJSON("http://samplify.herokuapp.com/track/sampled?id=" + currentTrackURI.toString(),function(result){
            var count = result.samples.length;
            console.log("Count of Sampled Tracks are " + count);
            for(var i=0; i<count;i++)
            {
                tracksFound = "NO";
                updateTrackSample(result.samples[i]);
            }
        });

        $.getJSON("http://samplify.herokuapp.com/track/sampling?id=" + currentTrackURI.toString(),function(result){
            var count = result.samples.length;
            console.log("Count of Sampling Tracks are " + count);
            for(var i=0; i<count;i++)
            {
                tracksFound = "NO";
                updateTrackSample(result.samples[i]);
            }
        });


        //Make this smarter
        updateArtistHeader();
        updateArtists();

    }

    function updateArtists(){

        var artistList = getCurrentArtistList();
        var artistFlag = "Artist Header Not Updated";
        var j;
        for(j=0;j< artistList.length; j++)
        {    
            $.ajax({
              url: "http://samplify.herokuapp.com/artist/sampled?id=" + artistList[j].uri,
              dataType: 'json',
              async: true,
              success: function(result) {
                var count = result.samples.length;
                // console.log("Count of Sampled tracks for " + artistList[j].name + " is " + count);
                for(var i=0; i<count;i++)
                {
                    updateArtistSample(result.samples[i], j);
                }
              }
            });

            $.ajax({
              url: "http://samplify.herokuapp.com/artist/sampling?id=" + artistList[j].uri,
              dataType: 'json',
              async: true,
              success: function(result) {
                var count = result.samples.length;
                // console.log("Count of Sampled tracks for " + artistList[j].name + " is " + count);
                for(var i=0; i<count;i++)
                {
                    updateArtistSample(result.samples[i], j);
                }
              }
            });
        }
    }

    function minutesFromSeconds(time)
    {
        var minutes = Math.floor(time/60);
        var seconds = time%60;
        return (minutes.toString() + ":" + seconds.toString());

    }

    // Updates the sample, sampling and the relationship, samples from artists
    function updateArtistSample(sample,id){

        // console.log("Getting artist samples");
        var tag = "#artist" + (id).toString();
        // console.log("Tag is " + tag);
        var artistSamplesHTML = $(tag);

        //Create Sample Context
        var sampling_track = models.Track.fromURI(sample.track1 + "#"  + minutesFromSeconds(sample.time1) );
        var sampling_track_playlist = new models.Playlist();
        sampling_track_playlist.add(sampling_track);
        var sampling_track_player = new views.Player();
        sampling_track_player.track = null; // Don't play the track right away
        sampling_track_player.position = minutesFromSeconds(sample.time1);
        sampling_track_player.context = sampling_track_playlist;

        //Update Sample
        $(sampling_track_player.node).addClass('sp-image-large');
        var samplingDiv = $("<div></div>").addClass("span5 sampling");
        samplingDiv.append(sampling_track_player.node);

        //Create Sample Context
        var sampled_track = models.Track.fromURI(sample.track2 + "#" + minutesFromSeconds(sample.time2));
        var sampled_track_playlist = new models.Playlist();
        sampled_track_playlist.add(sampled_track);
        var sampled_track_player = new views.Player();
        sampled_track_player.track = null; // Don't play the track right away
        sampled_track_player.position = minutesFromSeconds(sample.time2);
        sampled_track_player.context = sampled_track_playlist;

        //Update Sample
        $(sampled_track_player.node).addClass('sp-image-large');
        var sampledDiv = $("<div></div>").addClass("span5 sampled");
        sampledDiv.append(sampled_track_player.node);


        var relnDiv = $("<div></div>").addClass("span2 relationship");
        relnDiv.append(sample.relationship.partsampled + "</br>" + sample.relationship.kind);
        // Uppppppddddddaaaaaattttteeeeee!

        var outerDiv = $("<div></div>").addClass("row-fluid");
        outerDiv.append(samplingDiv);
        outerDiv.append(relnDiv);
        outerDiv.append(sampledDiv);
        artistSamplesHTML.append(outerDiv);

    }


    // Update the sample, sampling and the relationship, samples of track
    function updateTrackSample(sample){

        var trackSamplesHTML = $("#trackSamples");

        //Create Sample Context
        var sampling_track = models.Track.fromURI(sample.track1 + "#" + minutesFromSeconds(sample.time1));
        var sampling_track_playlist = new models.Playlist();
        sampling_track_playlist.add(sampling_track);
        var sampling_track_player = new views.Player();
        // sampling_track_player.track = null; // Don't play the track right away
        sampling_track_player.position = minutesFromSeconds(sample.time1);
        sampling_track_player.context = sampling_track_playlist;

        //Update Sample
        $(sampling_track_player.node).addClass('sp-image-large');
        var samplingDiv = $("<div></div>").addClass("span5 sampling");
        samplingDiv.append(sampling_track_player.node);

        //Create Sample Context
        var sampled_track = models.Track.fromURI(sample.track2 + "#" + minutesFromSeconds(sample.time2));
        var sampled_track_playlist = new models.Playlist();
        sampled_track_playlist.add(sampled_track);
        var sampled_track_player = new views.Player();
        // sampled_track_player.track = null; // Don't play the track right away
        sampled_track_player.position = minutesFromSeconds(sample.time2);
        sampled_track_player.context = sampled_track_playlist;

        //Update Sample
        $(sampled_track_player.node).addClass('sp-image-large');
        var sampledDiv = $("<div></div>").addClass("span5 sampled");
        sampledDiv.append(sampled_track_player.node);


        var relnDiv = $("<div></div>").addClass("span2 relationship");
        relnDiv.append(sample.relationship.partsampled + "</br>" + sample.relationship.kind + "</br>" + minutesFromSeconds(sample.time1) + "|" + minutesFromSeconds(sample.time2));
        // Uppppppddddddaaaaaattttteeeeee!
        trackSamplesHTML.append(samplingDiv);
        trackSamplesHTML.append(relnDiv);
        trackSamplesHTML.append(sampledDiv);


    }

    function getCurrentTrackURI(){
        // Get the track that is currently playing
        var currentTrack = player.track;
        var currentTrackURI = player.track.uri;
        var currentArtistList = player.track.artists;
        var currentAlbum = player.track.album.name;
        var currentAlbumURI = player.track.album.uri;

        return currentTrackURI;
    }

    function getCurrentTrackName(){
        // Get the track that is currently playing
        var currentTrack = player.track;
        var currentTrackURI = player.track.uri;
        var currentArtistList = player.track.artists;
        var currentAlbum = player.track.album.name;
        var currentAlbumURI = player.track.album.uri;

        return currentTrack;
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
        var currentTrack = getCurrentTrackName();
        var currentTrackURI = getCurrentTrackURI();
        if (currentTrack == null) {
            console.log("No track playing!");
            return false;
        } 
        else {

            $("#trackHeader").html("Tracks that sample or are sampled by " + "<a href='" + currentTrackURI + "'>" + currentTrack + "</a><div id='artist" + i.toString() + "'></div>")
            return true;
        }
    }

    function updateArtistHeader()
    {
        var artistList = getCurrentArtistList();
        var artistHeaderList = $("#artistHeaderList");
        for(var i=0;i<artistList.length; i++)
        {
            artistHeaderList.append('<div class="header">Samples from <a href="' + artistList[i].uri + '"">' + artistList[i].name + '</a></div><div id="artist' + i.toString() + '" class="row"></div>');

        }
    }
    function consolify(){

        $("#console").html("Track now playing is " + getCurrentTrackName());
        $("#console").append("Artists now playing are " + getCurrentArtistList());
    }
}
