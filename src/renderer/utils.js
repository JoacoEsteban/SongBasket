
export function resize_to_fit(outer, inner) {
    while(inner.height() > outer.height()) {
        var fontsize = parseInt(inner.css('font-size')) - 1;
        inner.css('font-size', fontsize);
        // some browsers(chrome) the min font return value is 12px
        if(fontsize <= 1 || parseInt(inner.css('font-size')) >= fontsize+1)
            break;
    }
}

export function convertMS( milliseconds ) {
    var day, hour, minutes, seconds;
    seconds = Math.floor(milliseconds / 1000);
    minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    return {
        minutes,
        seconds
    };
}