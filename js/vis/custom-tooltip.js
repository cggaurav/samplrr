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

    function updatePosition(event) {
        var xOffset = 15,
            yOffset = 15,
            ttw = tooltip.width(),
            tth = tooltip.height(),
            curX = event.pageX,
            curY = event.pageY - 60, // because of header

            ttleft = Math.max(((curX + xOffset * 2 + ttw) > $(window).width()) ? curX - ttw - xOffset * 2 : curX + xOffset, xOffset),
            tttop = ((curY + yOffset * 2 + tth) > $(window).height() - 150) ? curY - tth - yOffset * 2 : curY + yOffset;

        tooltip.css('top', tttop + 'px').css('left', ttleft + 'px');
    }

    return {
        showTooltip: showTooltip,
        hideTooltip: hideTooltip,
        updatePosition: updatePosition
    };
}
