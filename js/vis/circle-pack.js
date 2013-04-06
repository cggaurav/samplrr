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

function formatDataForGraph(data) {
    var nbrTags = 0;
    var result = new Array();
    for (var i = 0; i < data.length; i++)
    {
        if (data[i].length > 0)
        {
            console.log(i);
            var curTag = new Array();
            for (var j = 0; j < data[i].length; j++)
            {
                curTag[j] = {
                    'name' : data[i][j].name,
                    'size' : 1
                };
            }
            result[nbrTags] = {
                'name' : nbrTags,
                'children' : curTag
            };
            nbrTags = nbrTags + 1;
        }
    }
    var graph = {
        'name' : "",
        'children' : result
    };
    console.log(graph);
    return graph;
}

function loadCircleGraph(data, divName, animate) {
    console.log("called loadcircle graph with animate = " + animate);
    $(divName).empty(); // remove previous drawing(s)

    var w = $("#wrapper").width(),
        h = $("#wrapper").height(),
        r = Math.min(w, h) * 0.95,
        x = d3.scale.linear().range([0, r]),
        y = d3.scale.linear().range([0, r]),
        node,
        root;

    console.log(divName + " " + w + " " + h);

    var pack = d3.layout.pack()
        .size([r, r])
        .value(function(d) {
        return d.size;
    });

    var vis = d3.select(divName).insert("svg:svg")
        .attr("width", w)
        .attr("height", h)
        .append("svg:g")
        .attr("transform", "translate(" + (w - r) / 2 + "," + (h - r) / 2 + ")");

    if (data === null) data = generateData(); // sample data

    node = root = data;

    var nodes = pack.nodes(root);

    vis.selectAll("circle")
        .data(nodes)
        .enter().append("svg:circle")
        .attr("class", function(d) {
        return d.children ? "parent" : "child";
    })
        .attr("cx", function(d) {
        return d.x;
    })
        .attr("cy", function(d) {
        return d.y;
    })
        .attr("r", function(d) {
        return d.r;
    })
        .on("click", function(d) {
        return zoom(node == d ? root : d);
    });

    vis.selectAll("text")
        .data(nodes)
        .enter().append("svg:text")
        .attr("class", function(d) {
        return d.children ? "parent" : "child";
    })
        .attr("x", function(d) {
        return d.x;
    })
        .attr("y", function(d) {
        return d.y;
    })
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .style("opacity", function(d) {
        return d.r > 20 ? 1 : 0;
    })
        .text(function(d) {
        return d.name;
    });

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

        t.selectAll("text")
            .attr("x", function(d) {
            return x(d.x);
        })
            .attr("y", function(d) {
            return y(d.y);
        })
            .style("opacity", function(d) {
            return k * d.r > 20 ? 1 : 0;
        });

        node = d;
        d3.event.stopPropagation();
    }
}

// Triggered when the size of the window 
/*
$(window).resize(function() {
    loadCircleGraph(null, false);
});*/