// Search results consists of all results from a query.
// We want to split these so that they get categorised
// by the tags that we have defined.
var TAGS = [
    ["Instrumental" , ["instrumental", "karaoke"]],
    ["Dubstep" , ["dubstep"]],
    ["Electronic" , ["electronic", "trance", "synth"]],
    ["Country" , ["country", "western"]],
    ["Acoustic" , ["acoustic", "unplugged"]],
    ["Workout" , ["workout", "cardio", "training", "exercise", "gym"]],
    ["Lullabye" , ["lullabye", "baby", "kid", "child"]],
    ["Orchestra" , ["orchestra", "symphony"]],
    ["Other", []]
];

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
                    'artist': data[i][j].artists[0].name,
                    'album': data[i][j].album.name,
                    'albumArt': data[i][j].album.data.cover,
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
    t.selectAll("circle")
        .attr("cx", function(d) {
        return !d.children ? d.randX : generateRandomPoint();
    })
        .attr("cy", function(d) {
        return !d.children ? d.randY : generateRandomPoint();
    });

    // remove graph when the bubbles are gone
    setTimeout(function() {
        $(divName).empty();
        finishedCallback();
        return true;
    }, STANDARD_ZOOM_DURATION);
    if (d3.event) d3.event.stopPropagation();
}
function loadCircleGraph(data, divName, pickedSongCallback) {
    $(divName).empty();
    var w = $("#wrapper").width(),
        h = $("#wrapper").height(),
        r = Math.min(w, h) * 1.2,
        x = d3.scale.linear().range([0, r]),
        y = d3.scale.linear().range([0, r]),
        node,
        root,
        tooltip = CustomTooltip("posts_tooltip_" + divName.substring(1), 300, divName); // name should be unique

    var pack = d3.layout.pack()
        .size([r, r])
        .value(function(d) {
        return d.size;
    });

    var vis = d3.select(divName).append("svg:svg")
        .attr("width", w)
        .attr("height", h)
        .attr("class", "pack")
        .append("svg:g")
        .attr("transform", "translate(" + (w - r) / 2 + "," + (h - r) / 2 + ")");

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
        d.r *= 1.1;
        if (!d.children) {
            // make sure the circles are not to small or too big
            d.r = Math.min(130, Math.max(30, d.r));
        } else if (d.parent) d.r += 10;
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
        return !d.children ? d.randX : generateRandomPoint(); // init at the same place as its corresponding circle
    })
        .attr('y', function(d) {
        return !d.children ? d.randY : generateRandomPoint();
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

    // init circles (randomize starting positions for animation)
    nodes.append("svg:circle")
        .attr("cx", function(d) {
        return !d.children ? d.randX : generateRandomPoint();
    })
        .attr("cy", function(d) {
        return !d.children ? d.randY : generateRandomPoint();
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

    // Zoom out when user clicks ouside of the graph
    d3.select(divName).on("click", function() {
        zoom(root, STANDARD_ZOOM_DURATION);
    });

    // Zooms the entire graph so that node d is in the center of the view
    // The animation takes duration ms.

    function zoom(d, duration) {
        var k = r / d.r / 2;
        x.domain([d.x - d.r, d.x + d.r]);
        y.domain([d.y - d.r, d.y + d.r]);

        var t = vis.transition()
            .duration(duration);

        t.selectAll("circle")
            .attr("cx", function(d) {
            return x(d.x);
        })
            .attr("cy", function(d) {
            return y(d.y);
        })
            .attr("r", function(d) {
            return k * d.r;
        });

        t.selectAll("pattern")
            .attr('width', function(d) {
            return k * d.r * 2;
        })
            .attr('height', function(d) {
            return k * d.r * 2;
        })
            .attr("x", function(d) {
            return x(d.x) - k * d.r;
        })
            .attr("y", function(d) {
            return y(d.y) - k * d.r;
        });

        t.selectAll("image")
            .attr('width', function(d) {
            return k * d.r * 2;
        })
            .attr('height', function(d) {
            return k * d.r * 2;
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
        data.r += 5;
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
        data.r -= 5;
        zoom(node, 200);
        downlight(data, element);
    }
}