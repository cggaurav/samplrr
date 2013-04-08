// Search results consists of all results from a query.
// We want to split these so that they get categorised
// by the tags that we have defined.
var TAGS = ["Instrumental", "Karaoke", "Dubstep", "Electronic",
    "Country", "Acoustic", "Other"];

// Takes a result of a search and transforms it into the data format required
// for the d3 visualization

var STANDARD_ZOOM_DURATION  = 750;

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
                    'size': data[i][j].popularity,
                    'uri': data[i][j].uri
                };
            }
            result[nbrTags] = {
                'title': TAGS[i] + ((type == "remix") ? " remixes" : " covers"),
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
        .duration(750);
    t.selectAll("circle")
        .attr("cx", function(d) {
        return Math.random() * 10000 - 5000;
    })
        .attr("cy", function(d) {
        return Math.random() * 10000 - 5000;
    });
    // remove graph when the bubbles are gone
    setTimeout(function() {
        $(divName).empty();
        finishedCallback();
        return true;
    }, 750);
    if (d3.event) d3.event.stopPropagation();
}
// Shows a beautiful d3 circle visualization

function loadCircleGraph(data, divName, pickedSongCallback) {
    var w = $("#wrapper").width(),
        h = $("#wrapper").height(),
        r = Math.min(w, h) * 1.2, // to fill up most of the graph
        x = d3.scale.linear().range([0, r]),
        y = d3.scale.linear().range([0, r]),
        node,
        root,
        tooltip = CustomTooltip("posts_tooltip_" + divName.substring(1), 300, divName), // name should be unique
        tooltipShown = false;

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
        if (!d.children)
        {
          //  d.r *= 1.1;
            // make sure the circles are not to small or too big
            d.r = Math.min(150, Math.max(30, d.r));
        }
        else if (d.parent) d.r += 10;
    });

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
        return d.x - d.r;
    })
        .attr('y', function(d) {
        return d.y - d.r;
    })
        .append('svg:image')
        .attr('xlink:href', function(d) {
        return !d.children ? d.albumArt : "";
    })
        .attr('x', function(d) {
        return 0;
    })
        .attr('y', function(d) {
        return 0;
    })
        .attr('width', function(d) {
        return d.r * 2;
    })
        .attr('height', function(d) {
        return d.r * 2;
    });

    // init circles (randomize starting positions for animation)
    nodes.append("svg:circle")
        .attr("r", function(d) {
        return d.r;
    })
        .attr("cx", function(d) {
        return Math.random() * 10000 - 5000;
    })
        .attr("cy", function(d) {
        return Math.random() * 10000 - 5000;
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
    });

    // Update the position of the popover when the cursor is moved
    d3.select(divName).on("mousemove", function(d, i) {
        if (tooltipShown === true) move(d, i);
    });

    zoom(root, STANDARD_ZOOM_DURATION); // to get the nodes in the right positions

    d3.select(divName).on("click", function() {
        zoom(root, STANDARD_ZOOM_DURATION);
    });

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
        node = d;
        if (d3.event) d3.event.stopPropagation();
    }

    // returns a unique string for a track object that can be used as an ID
    function getUniqueId(data)
    {
        return data.uri.substring(15);
    }

    function highlight(tooltipContent, element) {
        tooltipShown = true;
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
        tooltipShown = false;
        tooltip.hideTooltip();
    }

    function downlightSong(data, element) {
        data.r -= 5;
        zoom(node, 200);
        downlight(data, element);
    }
}