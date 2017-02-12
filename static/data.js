$(document).ready(function() {
    $('#upload').change((e)=>{
        var f = e.target.files[0];
        if (f) {
            var r = new FileReader();
            r.onload = function(e) {
                window.har_data = $.parseJSON(e.target.result);
                $.each(har_data.log.entries, function( index, value ) {
                    delete value.response.content.text;
                });
            }
            r.readAsText(f);
        } else {
            alert("Failed to load file");
        }
    });
});
