require([
  '$api/models',
  'scripts/refreshButton',
  'scripts/throbber'
], function(models, refreshButton, throbber) {
  'use strict';

  var SAMPLIFY_COLLAB_PLAYLIST_SAMPLES = "spotify:user:cggaurav:playlist:6RR4sZhswpFYkhgCxm5HfC";
  var SAMPLIFY_COLLAB_PLAYLIST_REMIXES = "spotify:user:faximan:playlist:3WmosOs2FKQgafFv5pQrrT";
  var SAMPLIFY_COLLAB_PLAYLIST_COVERS = "spotify:user:faximan:playlist:1uZXfGQXYUefaWCuS6qnRd";

  // When application has loaded, run pages function
  models.application.load('arguments').done(tabs);

  // When arguments change, run pages function
  models.application.addEventListener('arguments', tabs);

  //Place the refresh Button
  refreshButton.place();

  function tabs() {
    var args = models.application.arguments;
    var current = $('#' + args[0]);
    // console.log("Current tab is ", current);
    $(".section").each(function() {
      $(this).hide(); // hide all tabs...
    });
    current.show(); // ... and show the current one
  }


  // languageExample.doHelloWorld();
  // coverExample.doCoverForAlbum();
  // buttonExample.doShareButtonForArtist();
  // buttonExample.doPlayButtonForAlbum();
  // playlistExample.doPlaylistForAlbum();

});
