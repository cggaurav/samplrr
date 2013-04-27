// Search results consists of all results from a query.
// We want to split these so that they get categorised
// by the tags that we have defined.
var TAGS = [
  ["Instrumental", ["instrumental", "karaoke"]],
  ["Dubstep", ["dubstep"]],
  ["Electronic", ["electronic", "trance", "synth"]],
  ["Country", ["country", "western"]],
  ["Acoustic", ["acoustic", "unplugged"]],
  ["Workout", ["workout", "cardio", "training", "exercise", "gym"]],
  ["Lullabye", ["lullabye", "baby", "kid", "child"]],
  ["Orchestra", ["orchestra", "symphony"]],
  ["Other", []]
];

// Returns a string with all the artists of a track, joined by a comma

function getArtistString(artistList) {
  var artists_array = [];
  for (i = 0; i < artistList.length; i++) {
    artists_array.push("<a href='" + artistList[i].uri + "'>" + artistList[i].name + "</a>");
  }
  return artists_array.join(', ');
}

// Takes a result of a search and transforms it into the data format required
// for the d3 visualization

var STANDARD_ZOOM_DURATION = 750;
var scale = d3.scale.linear().domain([0, 100]).range([10, 90]);

function generateRandomPoint() {
  // make sure point is outside of canvas

  var rand = Math.random();
  rand *= 4000;
  if (rand < 2000) rand = -rand;
  return rand;
}

function formatDataForGraph(data, type) {
  var nbrTags = 0;
  var result = [];
  for (var i = 0; i < data.length; i++) {
    if (data[i].length > 0) {
      var curTag = [];
      for (var j = 0; j < data[i].length; j++) {
        curTag[j] = {
          'title': data[i][j].name,
          'artist': getArtistString(data[i][j].artists),
          'album': data[i][j].album.name,
          'albumArt': data[i][j].album.image,
          'size': scale(data[i][j].popularity),
          'uri': data[i][j].uri,
          'randX': generateRandomPoint(),
          'randY': generateRandomPoint()
        };
      }
      result[nbrTags] = {
        'title': TAGS[i][0] + ((type == "remix") ? " remixes" : " covers"),
        'children': curTag
      };
      nbrTags = nbrTags + 1;
    }
  }
  var graph = {
    'title': ((type == "remix") ? " Remixes" : " Covers") + " of current track",
    'children': result
  };
  return graph;
}

// Removes the current graph with a nice animation

function animateOutGraph(divName, finishedCallback) {
  var vis = d3.select(divName);
  var t = vis.transition()
    .duration(STANDARD_ZOOM_DURATION);
  t.selectAll("rect")
    .attr("x", function(d) {
    return !d.children ? d.randX - d.r : generateRandomPoint();
  })
    .attr("y", function(d) {
    return !d.children ? d.randY - d.r : generateRandomPoint();
  });

  // remove graph when the bubbles are gone
  setTimeout(function() {
    $(divName).empty();
    finishedCallback();
    return true;
  }, STANDARD_ZOOM_DURATION);
  if (d3.event) d3.event.stopPropagation();
}

// Uses d3 circle pack layout to give a graphical representation of the found remixes and covers.
// However, we have choosen to display the covers as squares instead of circles since circular
// cover art is prohibited by Spotify due to legal reasons.
function loadCircleGraph(data, divName, pickedSongCallback) {
  $(divName).empty();
  var w = $("#wrapper").width(),
    h = $("#wrapper").height(),
    x = d3.scale.linear().range([0, w]),
    y = d3.scale.linear().range([0, h]),
    node,
    root,
    tooltip = CustomTooltip("posts_tooltip_" + divName.substring(1), 300, divName); // name should be unique

  var pack = d3.layout.pack()
    .size([w, h])
    .value(function(d) {
    return d.size;
  });

  var vis = d3.select(divName).append("svg:svg")
    .attr("width", w)
    .attr("height", h)
    .attr("class", "pack")
    .append("svg:g");

  node = root = data;

  var nodes = vis.selectAll("g.node")
    .data(pack.nodes(root))
    .enter()
    .append("svg:g")
    .attr("class", function(d) {
    return d.children ? (d.parent ? "parent" : "root") : "child";
  });

  // change circle size for asthetics
  pack.nodes(root).forEach(function(d, i) {
    if (!d.children) {
      // make sure the circles are not too small or too big
      //d.r = Math.min(400, Math.min(r, Math.max(60, d.r)));
    } else if (d.parent) d.r *= 1.1;
  });
  // inits a SVG image for the corresponding track bubble
  // implemented as a SVG pattern enclosing an image object
  nodes.append('svg:pattern')
    .attr('id', function(d) {
    return !d.children ? getUniqueId(d) : ""; // substring to get rid of problematic prefix
  })
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', function(d) {
    return d.r * 2;
  })
    .attr('height', function(d) {
    return d.r * 2;
  })
    .attr('x', function(d) {
    return !d.children ? d.randX - d.r : generateRandomPoint(); // init at the same place as its corresponding circle
  })
    .attr('y', function(d) {
    return !d.children ? d.randY - d.r : generateRandomPoint();
  })
    .append('svg:image')
    .attr('xlink:href', function(d) {
    return !d.children ? d.albumArt : "";
  })
    .attr('width', function(d) {
    return d.r * 2;
  })
    .attr('height', function(d) {
    return d.r * 2;
  });

  // init squares (randomize starting positions for animation)
  nodes.append("svg:rect")
    .attr("x", function(d) {
    return !d.children ? d.randX - d.r : generateRandomPoint();
  })
    .attr("y", function(d) {
    return !d.children ? d.randY - d.r : generateRandomPoint();
  })
    .attr("height", function(d) {
    return d.r * 2;
  })
    .attr("width", function(d) {
    return d.r * 2;
  })
    .attr('fill', function(d) {
    return !d.children ? "url(#" + getUniqueId(d) + ")" : null; // the albumArt suffix is unique
  })
    .on("click", function(d) {
    if (!d.children) return pickedSongCallback(d.uri); // clicked on song
    else return zoom(node == d ? root : d, STANDARD_ZOOM_DURATION); // clicked on outer circle, zoom zoom!
  })
    .on("mouseover", function(d, i) {
    if (!d.children) highlightSong(d, i);
    else if (d.parent) highlight(d.title, i);
  })
    .on("mouseout", function(d, i) {
    if (!d.children) downlightSong(d, i);
    else if (d.parent) downlight(d, i);
  })
    .on("mousemove", function(d, i) {
    move(d, i);
  });

  zoom(root, STANDARD_ZOOM_DURATION); // to get the nodes in the right positions

  // Adjusts the entire layout according to the current values of the circles.
  function zoom(d, duration) {
    var t = vis.transition()
      .duration(duration);

    t.selectAll("rect")
      .attr("x", function(d) {
      return d.x - d.r;
    })
      .attr("y", function(d) {
      return d.y - d.r;
    })
      .attr("width", function(d) {
      return d.r * 2;
    })
      .attr("height", function(d) {
      return d.r * 2;
    });

    t.selectAll("pattern")
      .attr("x", function(d) {
      return d.x - d.r;
    })
      .attr("y", function(d) {
      return d.y - d.r;
    })
      .attr('width', function(d) {
      return d.r * 2;
    })
      .attr('height', function(d) {
      return d.r * 2;
    });

    t.selectAll("image")
      .attr('width', function(d) {
      return d.r * 2;
    })
      .attr('height', function(d) {
      return d.r * 2;
    });

    node = d;
    if (d3.event) d3.event.stopPropagation();
  }

  // returns a unique string for a track object that can be used as an ID

  function getUniqueId(data) {
    return data.uri.substring(15);
  }

  function highlight(tooltipContent, element) {
    tooltip.showTooltip(tooltipContent, d3.event);
  }

  function highlightSong(data, element) {
    data.r += 5; // enlarge the cover
    zoom(node, 200);

    var content = "<span class=\"title\">Title </span>" + data.title +
      "<br /><span class=\"title\">Artist </span>" + data.artist +
      "<br /><span class=\"title\">Album </span>" + data.album;
    highlight(content, element);
  }

  function move(data, element) {
    tooltip.updatePosition(d3.event);
  }

  function downlight(data, element) {
    tooltip.hideTooltip();
  }

  function downlightSong(data, element) {
    data.r -= 5; // shrink cover to original size
    zoom(node, 200);
    downlight(data, element);
  }
}