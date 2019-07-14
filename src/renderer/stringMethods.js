
export function resize_to_fit(outer, inner) {
    while(inner.height() > outer.height()) {
        var fontsize = parseInt(inner.css('font-size')) - 1;
        inner.css('font-size', fontsize);
        // some browsers(chrome) the min font return value is 12px
        if(fontsize <= 1 || parseInt(inner.css('font-size')) >= fontsize+1)
            break;
    }
}