
var getLocation = function(href) {
    var l = document.createElement("a");
    l.href = href;
    return l;
};

$(document).ready(function() {
    $('#upload').change((e)=>{
        var f = e.target.files[0];
        if (f) {
            var r = new FileReader();
            r.onload = function(e) {
                window.filter_data = [];
                window.har_data = $.parseJSON(e.target.result);
                $.each(har_data.log.entries, function( index, value ) {

                    if (value.response.httpVersion == 'HTTP/2.0') {
                        console.log(value);
                    }

                    var host = 'Unknown';

                    $.each(value.request.headers, function (i) {
                        var v = value.request.headers[i];
                        if (v.name == "Host" || v.name == ":authority") {
                            host = v.value;
                        }
                    });

                    var type = 'Unknown';

                    if (value.response.content.mimeType.indexOf(';') > 0) {
                        type = value.response.content.mimeType.substring(0, value.response.content.mimeType.indexOf(';'));
                    }

                    var l = getLocation(value.request.url);
                    
                    window.filter_data.push({
                        index: index,
                        url: value.request.url,
                        method: value.request.method,
                        ipaddress: value.serverIPAddress,
                        status: "" + value.response.status,
                        type: type,
                        time: value.time,
                        host: host,
                        httpVersion: value.response.httpVersion,
                        path: l.pathname
                    });
                });
                window.dispatchEvent(new CustomEvent('dataChanged'));
            }
            r.readAsText(f);
        } else {
            alert("Failed to load file");
        }
    });
});
