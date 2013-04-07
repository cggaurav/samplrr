// Search results consists of all results from a query.
// We want to split these so that they get categorised
// by the tags that we have defined.
var TAGS = ["Instrumental", "Karaoke", "Dubstep", "Electronic",
    "Country", "Acoustic", "Other"];

// Takes a result of a search and transforms it into the data format required
// for the d3 visualization
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
                    'album' : data[i][j].album.name,
                    'size': data[i][j].popularity,
                    'uri' : data[i][j].uri
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

// Shows a beautiful d3 circle visualization
function loadCircleGraph(data, divName, pickedSongCallback) {
    $(divName).empty(); // remove previous drawing(s)

    var w = $("#wrapper").width(),
        h = $("#wrapper").height(),
        r = Math.min(w, h) * 0.95, // to fill up most of the graph
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
        return d.children ? "parent" : "child";
    });

    // init circles (randomize starting positions for animation)
    nodes.append("svg:circle")
        .attr("r", function(d) {
        return d.children ? d.r : d.r * 1.05;
    })
        .attr("cx", function(d) {
        return Math.random() * w;
    })
        .attr("cy", function(d) {
        return Math.random() * h;
    })
        .on("click", function(d) {
            if (!d.children) return pickedSongCallback(d.uri); // clicked on song
            else return zoom(node == d ? root : d); // clicked on outer circle, zoom zoom!
    })
        .on("mouseover", function(d, i) {
        if (!d.children) highlightSong(d, i);
        else highlight(d.title, i);
    })
        .on("mouseout", function(d, i) {
           downlight(d, i);
    });

    // Update the position of the popover when the cursor is moved
    d3.select(divName).on("mousemove", function(d, i) {
        if (tooltipShown === true) move(d, i);
    });

    zoom(root); // to get the nodes in the right positions

    d3.select(divName).on("click", function() {
        console.log("clicked window should zoom to root");
        zoom(root);
    });

    function zoom(d, i) {
        var k = r / d.r / 2;
        x.domain([d.x - d.r, d.x + d.r]);
        y.domain([d.y - d.r, d.y + d.r]);

        var t = vis.transition()
            .duration(750);

        t.selectAll("circle")
            .attr("cx", function(d) {
            return x(d.x);
        })
            .attr("cy", function(d) {
            return y(d.y);
        })
            .attr("r", function(d) {
            return d.children ? k * d.r : k * d.r * 1.05;
        });
        node = d;
        d3.event.stopPropagation();
    }

    function highlight(tooltipContent, element)
    {
        tooltipShown = true;
        tooltip.showTooltip(tooltipContent, d3.event);
    }

    function highlightSong(data, element) {
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
}