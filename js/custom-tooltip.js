/**
 * Modified from vlandham.github.com/vis/gates/js/CustomTooltip.js
 */
function CustomTooltip( tooltipId, divName ) {

    // prevent us from creating the same div several times
    if (!$('#' + tooltipId).length)
        $(divName).append("<div class='tooltip' id='" + tooltipId + "'></div>");

    var tooltip = $('#'+tooltipId);

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
            wscrY = $(divName).scrollTop(),
            curX = event.pageX,
            curY = event.pageY + wscrY - 60; // because of header

            ttleft = Math.max(((curX + xOffset * 2 + ttw + 30) > $(window).width()) ? curX - ttw - xOffset * 2 : curX + xOffset, xOffset),
            // + 30 because of possible scrollbar to the right
            tttop = ((curY - wscrY + yOffset * 2 + tth) > $(window).height() - 150) ? curY - tth - yOffset * 2 : curY + yOffset;
            // - 150 because of header and footer

        tooltip.css('top', tttop + 'px').css('left', ttleft + 'px');
    }

    return {
        showTooltip: showTooltip,
        hideTooltip: hideTooltip,
        updatePosition: updatePosition
    };
}
