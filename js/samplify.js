/* Code by Andrew Mager
*
*  Spotify green: #74c043
*
**/
window.onload = function() {
    sp = getSpotifyApi(1);
    var models = sp.require('sp://import/scripts/api/models');
    var views = sp.require('sp://import/scripts/api/views');
    var player = models.player;
    var library = models.library;
    var application = models.application;


    var currentTrackSampled;

    // Test minutesFromSeconds
    // console.log(minutesFromSeconds(54));
    // console.log(minutesFromSeconds(128));

    // Handle tabs
    tabs();
    models.application.observe(models.EVENT.ARGUMENTSCHANGED, tabs);


    models.player.observe(models.EVENT.CHANGE, function(event) {
        console.log('Event change');
        console.log(event);
        if(event.data.curtrack) {
            $('#sampleView').empty();
            updateTrackSample();
        }
    });

    // // Handle share popup
    // var share_element = document.getElementById('share-popup');
    // var share_content = 'spotify:track:76a6mUM5r7VPexAj37TLjo';
    // share_element.addEventListener('click', displayPopup);
    // function displayPopup() {
    //     models.application.showSharePopup(share_element, share_content);
    // }

    function tabs() {
        var args = models.application.arguments;
        var current = document.getElementById(args[0]);
        var sections = document.getElementsByClassName('section');
        for (i=0;i<sections.length;i++){
            sections[i].style.display = 'none';
        }
        current.style.display = 'block';
    }

    //Autocomplete
    // $("#auto").autocomplete({
    //     source: ["Alfa","Alpha","Bravo","Charlie","Delta","Echo","Foxtrot","Golf","Hotel",
    // "India","Juliett","Juliet","Kilo","Lima","Mike","November","Oscar","Papa"]
    // });

    function updateTrackSample(){
        console.log("We are updating!");
        var currentTrackURI = getCurrent();
        currentTrackSampled = currentTrackURI;
        // console.log(currentTrackURI);
        $.getJSON("http://samplify.herokuapp.com/track/sampled?id=" + currentTrackURI.toString(),function(result){
            console.log(result);
            var count = result.samples.length;
            console.log(count);
            for(var i=0; i<count;i++)
            {
                updateTrackSampled(result.samples[i].track1,minutesFromSeconds(result.samples[i].time1),result.samples[i].artist1);
                updateTrackSampling(result.samples[i].track2,minutesFromSeconds(result.samples[i].time2),result.samples[i].artist2);
                updateRelationship(result.samples[i].relationship.kind,result.samples[i].relationship.partsampled);
            }
        });

        $.getJSON("http://samplify.herokuapp.com/track/sampling?id=" + currentTrackURI.toString(),function(result){
            console.log(result);
            var count = result.samples.length;
            console.log(count);
            for(var i=0; i<count;i++)
            {
                updateTrackSampled(result.samples[i].track1,minutesFromSeconds(result.samples[i].time1),result.samples[i].artist1);
                updateTrackSampling(result.samples[i].track2,minutesFromSeconds(result.samples[i].time2),result.samples[i].artist2);
                updateRelationship(result.samples[i].relationship.kind,result.samples[i].relationship.partsampled);
            }
        });
    }

    function minutesFromSeconds(time)
    {
        var minutes = Math.floor(time/60);
        var seconds = time%60;
        return (minutes.toString() + ":" + seconds.toString());

    }
    function updateRelationship(kind, partSampled){
        
        $("#sampleView").append('<div class="relationship">' + "<h4>" + kind + "</br>" + partSampled + "</h4>" + "</div>");
    }

    function updateTrackSampled(uri,time,artist){


        // var single_track = models.Track.fromURI('spotify:track:0blzOIMnSXUKDsVSHpZtWL');
        var single_track = models.Track.fromURI(uri);
        var single_track_playlist = new models.Playlist();
        single_track_playlist.add(single_track);

        var single_track_player = new views.Player();
        single_track_player.track = null; // Don't play the track right away
        single_track_player.context = single_track_playlist;


        /* Pass the player HTML code to the #single-track-player <div /> */
        
        $(single_track_player.node).addClass('sp-image-extra-large');
        var div = $("<div></div>").addClass("sampled");
        div.append(single_track_player.node);
        var play = '<a href="' + uri + "#" + time + '"><button class="new-button">Play where Sampled</button></a>';
        $("#sampleView").append(div);
        // $("#sampleView").append(play);


    }

    function updateTrackSampling(uri,time,artist){

        // var single_track = models.Track.fromURI('spotify:track:0blzOIMnSXUKDsVSHpZtWL');
        var single_track = models.Track.fromURI(uri);
        var single_track_playlist = new models.Playlist();
        single_track_playlist.add(single_track);

        var single_track_player = new views.Player();
        single_track_player.track = null; // Don't play the track right away
        single_track_player.context = single_track_playlist;

        /* Pass the player HTML code to the #single-track-player <div /> */
        $(single_track_player.node).addClass('sp-image-extra-large');
        var div = $("<div></div>").addClass("sampling");
        div.append(single_track_player.node);
        var play = '<a href="' + uri + "#" + time + '"><button class="new-button">Play where Sampled</button></a>';
        $("#sampleView").append(div);
        // $("#sampleView").append(play);

    }

    function getCurrent(){
        // Get the track that is currently playing
        var currentTrack = player.track;
        var currentTrackURI = player.track.uri;
        var currentArtistList = player.track.artists;
        var currentAlbum = player.track.album.name;
        var currentAlbumURI = player.track.album.uri;

        var consoleHTML = $("#console");
        // if nothing currently playing
        if (currentTrack == null) {
            consoleHTML.html('<p>No track currently playing</p>');
            return null;
        } else {
            var html = "";
            html+= 'Now playing: ' + "<a href='" + currentTrackURI  + "'>" + currentTrack + "</a></br>";
            html+= 'Artist: ';
            for(var i=0; i< currentArtistList.length; i++)
                html += '        ' + "<a href='" + currentArtistList[i].uri+ "'>" + currentArtistList[i].name +  "</a></br>";
            html+= 'Album: ' + "<a href='" + currentAlbumURI + "'>"  + currentAlbum + "</a></br>";
            consoleHTML.html(html);
            return currentTrackURI;
        }
    }


    function getCurrentArtistList(){
        var currentArtistList = player.track.artists;
        var currentArtistListURI = []
        for(var i=0; i< currentArtistList.length; i++)
            currentArtistListURI.push(currentArtistList[i].uri);
        return currentArtistListURI

    }
    
    // // Handle drops
    // var drop_box = document.querySelector('#drop_box');

    // drop_box.addEventListener('dragstart', function(e){
    //     e.dataTransfer.setData('text/html', this.innerHTML);
    //     e.dataTransfer.effectAllowed = 'copy';
    // }, false);

    // drop_box.addEventListener('dragenter', function(e){
    //     if (e.preventDefault) e.preventDefault();
    //     e.dataTransfer.dropEffect = 'copy';
    //     this.classList.add('over');
    // }, false);

    // drop_box.addEventListener('dragover', function(e){
    //     if (e.preventDefault) e.preventDefault();
    //     e.dataTransfer.dropEffect = 'copy';
    //     return false;
    // }, false);

    // drop_box.addEventListener('drop', function(e){
    //     if (e.preventDefault) e.preventDefault();
    //     var drop = models.Playlist.fromURI(e.dataTransfer.getData('text'));
    //     console.log(drop);
    //     this.classList.remove('over');
    //     var success_message = document.createElement('p');
    //     success_message.innerHTML = 'Playlist successfully dropped: ' + drop.uri;
    //     this.appendChild(success_message);
    // }, false);

    // // Handle multiple tracks player
    // var library_tracks = models.library.tracks;

    // var multiple_tracks_playlist = new models.Playlist();
    // for(var i=0;i<20;i++) {
    //     var library_track = models.Track.fromURI(library_tracks[i].data.uri);
    //     multiple_tracks_playlist.add(library_track);
    // }

    // console.log(multiple_tracks_playlist);
    // var multiple_tracks_player = new views.List(multiple_tracks_playlist);
    // multiple_tracks_player.track = null; // Don't play the track right away
    // multiple_tracks_player.context = multiple_tracks_playlist;
   
    // /* Pass the player HTML code to #multiple-tracks-player */
    // var multiple_tracks_player_HTML = document.getElementById('multiple-tracks-player');
    // multiple_tracks_player_HTML.appendChild(multiple_tracks_player.node);


    //First time use
    updateTrackSample();

}
