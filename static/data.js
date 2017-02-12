
var getLocation = function(href) {
    var l = document.createElement("a");
    l.href = href;
    return l;
};

window.filter_settings = [];

$(document).ready(function() {



    $('#render').click(  (e) => {

        $('select').each( function() {

          //  console.log($(this).val());
            window.filter_settings.push($(this).val());
        });

        //console.log(window.filter_settings);

        window.dispatchEvent(new CustomEvent('dataChanged'));
    });




    $('#upload').change((e)=>{
        var f = e.target.files[0];
        if (f) {
            var r = new FileReader();
            r.onload = function(e) {
                window.filter_data = [];
                window.har_data = $.parseJSON(e.target.result);
                $.each(har_data.log.entries, function( index, value ) {

                    var type = 'Not set';

                    if (value.response.content['mimeType'] && value.response.content.mimeType.indexOf(';') > 0) {
                        type = value.response.content.mimeType.substring(0, value.response.content.mimeType.indexOf(';'));
                    }


                    if (type =='Not set') {

                        if (value.request.url.indexOf('\.js') > 0) {
                            type = 'text/javascript';
                        }
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
                        host: l.hostname,
                        httpVersion: value.response.httpVersion,
                        path: l.pathname
                    });
                });

                $('#selections').show();
            }
            r.readAsText(f);
        } else {
            alert("Failed to load file");
        }
    });
    $("#styled_upload").click(function(){
        $("#upload").click();
        return false;
    });
});
