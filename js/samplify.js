window.onload = function() {
    sp = getSpotifyApi(1);
    var models = sp.require('sp://import/scripts/api/models');
    var views = sp.require('sp://import/scripts/api/views');
    var player = models.player;
    var library = models.library;
    var application = models.application;
    var root = 'spotify:app:'+window.location.hostname + ":";
    var server = 'http://samplify.herokuapp.com/';

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
            console.log("CurTrack");
            clearTracks();
            updateTracks();
        }

    });


    $("#refresh").click(function() {
        clearTracks();
        updateTracks();
    });


    // $(window).keypress(function(e) {
    //   if (e.keyCode == 0) {
    //     console.log('Space pressed');
    //   }
    // });

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
        // console.log(currentTrackURI);
        $.getJSON(server + "track/sampled?id=" + currentTrackURI.toString(),function(result){
            var count = result.samples.length;
            // console.log("Count of Sampled Tracks are " + count);
            for(var i=0; i<count;i++)
            {
                updateTrackSample(result.samples[i]);
            }
        });

        $.getJSON(server  + "track/sampling?id=" + currentTrackURI.toString(),function(result){
            var count = result.samples.length;
            // console.log("Count of Sampling Tracks are " + count);
            for(var i=0; i<count;i++)
            {
                updateTrackSample(result.samples[i]);
            }
        });


        //Make this smarter
        updateArtistHeader();
        updateArtists();

    }

    function updateArtists(){

        var artistList = getCurrentArtistList();
        for(var j=0;j< artistList.length; j++)
        {    
            //Make calls with closure, how?
            (function(uri,j) 
            {
                $.getJSON(server + "artist/sampling?id=" + uri,function(result){
                    for(var i=0;i<result.samples.length;i++){
                        // console.log("We are being called!");
                        updateArtistSample(result.samples[i],j);
                    }
                });

                $.getJSON(server + "artist/sampled?id=" + uri,function(result){
                    for(var i=0;i<result.samples.length;i++){
                        // console.log("We are being called too!");
                        updateArtistSample(result.samples[i],j);
                    }
                });
            })(artistList[j].uri,j);

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
        var samplingDiv = $("<div></div>").addClass("sampling");
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
        var sampledDiv = $("<div></div>").addClass("sampled");
        sampledDiv.append(sampled_track_player.node);


        var relnDiv = $("<div></div>").addClass("relationship");
        relnDiv.append(sample.relationship.partsampled + "</br>" + sample.relationship.kind);
        // Uppppppddddddaaaaaattttteeeeee!

        var outerDiv = $("<div></div>").addClass("sample");
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
        var samplingDiv = $("<div></div>").addClass("sampling");
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
        var sampledDiv = $("<div></div>").addClass("sampled");
        sampledDiv.append(sampled_track_player.node);


        var relnDiv = $("<div></div>").addClass("relationship");
        relnDiv.append(sample.relationship.partsampled + "</br>" + sample.relationship.kind + "</br>" + minutesFromSeconds(sample.time1) + "|" + minutesFromSeconds(sample.time2));
        // Uppppppddddddaaaaaattttteeeeee!

        var outerDiv = $("<div></div>").addClass("sample");
        outerDiv.append(samplingDiv);
        outerDiv.append(relnDiv);
        outerDiv.append(sampledDiv);

        trackSamplesHTML.append(outerDiv);



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

            $("#trackHeader").html("♫ " + "<a href='" + root + currentTrackURI + "'>" + currentTrack + "</a><div id='artist" + i.toString() + "'></div>");
            // $("#trackHeader").html("♫ " + currentTrack + "<div id='artist" + i.toString() + "'></div>")
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
    function consolify(){

        $("#console").html("Track now playing is " + getCurrentTrackName());
        $("#console").append("Artists now playing are " + getCurrentArtistList());
    }
}
