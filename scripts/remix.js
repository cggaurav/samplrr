require(['$api/models', 'scripts/samplrr_utils', 'scripts/throbber'],

function(Models, samplrr, throbber) {

  //D3 specific constants
  var w = $(window).width(),
      h = $(window).height(),
      node,
      link,
      root,
      force,
      viz;

  // console.log("Width is ",w);
  // console.log("Height is ",h);

  function getUniqueId(d) {
    return d.uri;
  }

  function drawUI(graph){

    force = d3.layout.force()
        .on("tick", tick)
        // .charge(function(d) { return d._children ? -d.size / 100 : -30; })
        // .linkDistance(function(d) { return d.target._children ? 80 : 30; })
        .linkDistance(function(d){ return 250;})
        .charge(function(d){ return -150;})
        .size([w, h - 160]);

    vis = d3.select("#remixes_viz").append("svg:svg")
        .attr("viewBox","0 0 " + w + " " +(h - 100))

    root = graph;
    root.fixed = true;
    root.x = w / 2;
    root.y = h / 2 - 80;
    update();
  }

  function update(){

    var nodes = flatten(root),
        links = d3.layout.tree().links(nodes);

    // Restart the force layout.
    force
        .nodes(nodes)
        .links(links)
        .start();

    // Update the links…
    link = vis.selectAll("line.link")
        .data(links, function(d) { return d.target.id; });

    // Enter any new links.
    link.enter().insert("svg:line", ".node")
        .attr("class", "link")
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    // Exit any old links.
    link.exit().remove();

    // Update the nodes…
    node = vis.selectAll("rect.node")
        .data(nodes, function(d) { return d.id; })
        .style("fill", color);

    node.transition()
        .attr("width", function(d) { return d.children ? 25 : square_size(d); })
        .attr("height", function(d) { return d.children ? 25 : square_size(d); })

    // Enter any new nodes.

    node.enter().append('svg:pattern')
      .attr('id', function(d) { return getUniqueId(d);}) // substring to get rid of problematic prefix})
      // .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', function(d) { return d.children ? 25 : square_size(d);})
      .attr('height', function(d) { return d.children ? 25 : square_size(d);;})
      .append('svg:image')
      .attr('xlink:href', function(d) { return d.albumArt;})
      .attr('width', function(d) { return d.children ? 25 : square_size(d);;})
      .attr('height', function(d) { return d.children ? 25 : square_size(d);;});

    node.enter().append("svg:rect")
        .attr("class", "node")
        .attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; })
        .attr("width", function(d) { return d.children ? 25 : square_size(d); })
        .attr("height", function(d) { return d.children ? 25 : square_size(d); })
        .on("click", click)
        .attr('fill', function(d) { return "url(#" + getUniqueId(d) + ")";})
        .call(force.drag);


    // Exit any old nodes.
    node.exit().remove();
  }
  function square_size(d)
  {
    // return d.size;
    return 30;
  }

  function tick() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("x", function(d) { return (d.x - square_size(d)/2); })
        .attr("y", function(d) { return (d.y - square_size(d)/2); });
  }

  // Color leaf nodes orange, and packages white or blue.
  function color(d) {
    return d._children ? "#cba213" : d.children ? "#c6dbef" : "#fd8d3c";
  }

  // Toggle children on click.
  function click(d) {
    // if (d.children) {
    //   d._children = d.children;
    //   d.children = null;
    // } else {
    //   d.children = d._children;
    //   d._children = null;
    // }
    // update();
    Models.player.playTrack(Models.Track.fromURI(d.uri));
  }

  // Returns a list of all nodes under the root.
  function flatten(root) {
    var nodes = [], i = 0;

    function recurse(node) {
      if (node.children) node.size = node.children.reduce(function(p, v) { return p + recurse(v); }, 0);
      if (!node.id) node.id = ++i;
      nodes.push(node);
      return node.size;
    }

    root.size = recurse(root);
    return nodes;
  }

  throbber.showRemixThrobber();
  samplrr.getGraph("remix", function(err, graph){
    console.log("remix",err, graph);
    if(err ==- null){
      throbber.hideRemixThrobber();
      $('#remixes_viz').append("<p>No Remixes Found</p>").addClass("no");
    }
    else
    {
      throbber.hideRemixThrobber();
      drawUI(graph);
    }
  });

});
