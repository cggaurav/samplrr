// dummy data
/*
function getChildren(depth) {
    var kids = new Array();

    if (depth != 2) {
        for (var i = 0; i < 5; i++) {
            kids[i] = {
                'name': i,
                'size': Math.floor((Math.random() * 1000) + 1),
                'children': getChildren(depth + 1)
            };
        }
    } else {
        for (var i = 0; i < 5; i++) {
            kids[i] = {
                'name': i,
                'size': Math.floor((Math.random() * 1000) + 1)
            };
        }
    }
    return kids;
}

function generateData() {
    return {
        'name': "This is the parent",
        'children': getChildren(1)
    };
}
*/

function formatDataForGraph(data) {
    var nbrTags = 0;
    var result = [];
    for (var i = 0; i < data.length; i++) {
        if (data[i].length > 0) {
            var curTag = [];
            for (var j = 0; j < data[i].length; j++) {
                curTag[j] = {
                    'name': data[i][j].name,
                    'size': data[i][j].popularity,
                    'title': data[i][j].uri
                };
            }
            result[nbrTags] = {
                'name': nbrTags,
                'children': curTag
            };
            nbrTags = nbrTags + 1;
        }
    }
    var graph = {
        'name': "",
        'children': result
    };
    return graph;
}

function loadCircleGraph(data, divName) {
    $(divName).empty(); // remove previous drawing(s)

    var w = $("#wrapper").width(),
        h = $("#wrapper").height(),
        r = Math.min(w, h) * 0.95, // to fill up most of the graph
        x = d3.scale.linear().range([0, r]),
        y = d3.scale.linear().range([0, r]),
        node,
        root,
        tooltip = CustomTooltip("posts_tooltip", 240, divName),
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
        return d.r;
    })
        .attr("cx", function(d) {
        return Math.random() * w;
    })
        .attr("cy", function(d) {
        return Math.random() * h;
    })
        .on("click", function(d) {
        return zoom(node == d ? root : d.children ? d : null);
    })
        .on("mouseover", function(d, i) {
        if (!d.children) highlight(d, i);
    })
        .on("mouseout", function(d, i) {
        if (!d.children) downlight(d, i);
    });
    d3.select(window).on("mousemove", function(d, i) {
            if (tooltipShown === true)
                move(d, i); });

    zoom(root); // to get the nodes in the right positions

    d3.select(window).on("click", function() {
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
            return k * d.r;
        });

        node = d;
        d3.event.stopPropagation();
    }

    function highlight(data, element) {

        //var description = node.description.split("|"),
        // content = '<span class=\"title\"><a href=\"' + data.url + '\">' + data.title + '</a></span><br/>' +
        // description[0] + "<br/>" +
        // '<a href=\"http://news.ycombinator.com/item?id='+ data.item_id +'\">' + description[1] + '</a>';

        tooltipShown = true;
        tooltip.showTooltip(data.title, d3.event);
    }

    function move(data, element) {
        tooltip.updatePosition(d3.event);
    }

    function downlight(data, element) {
        tooltipShown = false;
        tooltip.hideTooltip();
        //d3.select(element).attr("stroke", function(d) { return d3.rgb( z( d.comments )).darker(); });
    }
}