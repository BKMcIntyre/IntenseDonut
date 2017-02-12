$(document).ready(function() {
    $('#upload').change((e)=>{
        var f = e.target.files[0];
        if (f) {
            var r = new FileReader();
            r.onload = function(e) {
                window.filter_data = [];
                window.har_data = $.parseJSON(e.target.result);
                $.each(har_data.log.entries, function( index, value ) {
                    window.filter_data.push({
                        index: index,
                        url: value.request.url,
                        method: value.request.method,
                        ipaddress: value.serverIPAddress,
                        status: value.response.status,
                        type: value.response.content.mimeType
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
