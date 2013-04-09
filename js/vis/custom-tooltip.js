/**
 * Modified from vlandham.github.com/vis/gates/js/CustomTooltip.js
 */
function CustomTooltip( tooltipId, width, divName ) {

    // prevent us from creating the same div several times
    if (!$('#' + tooltipId).length)
        $(divName).append("<div class='tooltip' id='" + tooltipId + "'></div>");

    var tooltip = $('#'+tooltipId);

   // tooltip.on("mouseleave", function(e) { hideTooltip(); });

    hideTooltip();

    function showTooltip( content, event ) {
        tooltip
            .html(content)
            .show();

        updatePosition(event);
    }

    function hideTooltip(){
        tooltip.hide();
    }

    function updatePosition( event ) {
        var ttw = tooltip.width(),
            tth = tooltip.height(),
            wscrY = $(divName).scrollTop(),
            wscrX = $(divName).scrollLeft(),
            curX =  event.pageX + 10,
            curY =  event.pageY - 50,
            ttleft = Math.max( ((curX - wscrX + ttw) > $(divName).width()) ? curX - ttw : curX, wscrX ),
            tttop = Math.max( ((curY - wscrY + tth) > $(divName).height()) ? curY - tth : curY, curY );

            tooltip.css('top', tttop + 'px').css('left', ttleft + 'px');
    }

    return {
        showTooltip: showTooltip,
        hideTooltip: hideTooltip,
        updatePosition: updatePosition
    };
}
