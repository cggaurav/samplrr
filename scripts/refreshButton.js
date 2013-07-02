require([
  '$api/models',
  '$views/buttons'
], function(models, buttons) {
  'use strict';

  var place = function(){
  	console.log("Placing the Refresh Button!");
    var button = buttons.Button.withLabel('Refresh');
    $('.refreshButton').append(button.node);
  }
  exports.place = place;
});
