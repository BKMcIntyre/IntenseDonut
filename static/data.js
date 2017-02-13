function renderInfo(id) {
    $('#allInfo').empty();
    var jsonPretty = JSON.stringify(har_data.log.entries[id], null, ' ');
    $('#allInfo').append($('<pre>').text(jsonPretty));
}


$(document).ready(function() {



    function showDetails(d) {

        $('table').empty();

        var all_children = [];

        function getAllLeaf(data) {
            if (data['children']) {
                for (var i in data['children']) {
                    getAllLeaf(data['children'][i]);
                }
            } else {
                all_children.push(data);
            }
        }

        getAllLeaf(d);

        $.each(all_children, function(i) {
            // Table content
            $('table').append($('<tr><td></td></tr>').html('<button class="index_children" onclick="renderInfo(' + all_children[i].index + ')">' + all_children[i].size + 'ms - ' + all_children[i].url + '</button>'));
        });

        // Parent data

        var all_parents = [];

        function getAllParents(data) {
            if (data['parent']) {

                getAllParents(data['parent']);

            }

            all_parents.push({
                type: data.filter_name,
                name: data.name
            });
        }

        getAllParents(d);

        $('#parents').empty();

        for (var i in all_parents) {
            if (all_parents[i].type && all_parents[i].name) {
                $('#parents').append($("<p></p>").text(all_parents[i].type + " is " + all_parents[i].name));
            }
        }
        //$('#parents').append($("<p></p>").text('References:'));
    }



    var width = 800,
        height = 780,
        radius = Math.min(width, height) / 2;

    var x = d3.scale.linear()
        .range([0, 2 * Math.PI]);

    var y = d3.scale.linear()
        .range([0, radius]);

    var color = d3.scale.category20c();

    var svg = d3.select("#chart").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + (height / 2) + ")");

    var partition = d3.layout.partition()
        .value(function(d) {
            return d.size;
        });

    var arc = d3.svg.arc()
        .startAngle(function(d) {
            return Math.max(0, Math.min(2 * Math.PI, x(d.x)));
        })
        .endAngle(function(d) {
            return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx)));
        })
        .innerRadius(function(d) {
            return Math.max(0, y(d.y));
        })
        .outerRadius(function(d) {
            return Math.max(0, y(d.y + d.dy));
        });


    // Interpolate the scales!
    function arcTween(d) {
        var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
            yd = d3.interpolate(y.domain(), [d.y, 1]),
            yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
        return function(d, i) {
            return i ? function(t) {
                return arc(d);
            } : function(t) {
                x.domain(xd(t));
                y.domain(yd(t)).range(yr(t));
                return arc(d);
            };
        };
    }

    function drawChart(root) {

        var g = svg.selectAll("g")
            .data(partition.nodes(root))
            .enter().append("g");

        var path = g.append("path")
            .attr("d", arc)
            .style("fill", function(d) {
                return color((d.children ? d : d.parent).name);
            })
            .on("click", click);

        var text = g.append("text")
            .attr("transform", function(d) {
                return "rotate(" + computeTextRotation(d) + ")";
            })
            .attr("x", function(d) {
                return y(d.y);
            })
            .attr("dx", "6") // margin
            .attr("dy", ".35em") // vertical-align
            .text(function(d) {

                return d.name;
            })
            .on("click", click);

        function click(d) {

            showDetails(d);
            // fade out all text elements
            text.transition().attr("opacity", 0);

            path.transition()
                .duration(750)
                .attrTween("d", arcTween(d))
                .each("end", function(e, i) {
                    // check if the animated element's data e lies within the visible angle span given in d
                    if (e.x >= d.x && e.x < (d.x + d.dx)) {
                        // get a selection of the associated text element
                        var arcText = d3.select(this.parentNode).select("text");
                        // fade in the text element and recalculate positions
                        arcText.transition().duration(750)
                            .attr("opacity", 1)
                            .attr("transform", function() {
                                return "rotate(" + computeTextRotation(e) + ")"
                            })
                            .attr("x", function(d) {
                                return y(d.y);
                            });
                    }
                });
        }


        d3.select(self.frameElement).style("height", height + "px");


    }

    function computeTextRotation(d) {
        return (x(d.x + d.dx / 2) - Math.PI / 2) / Math.PI * 180;
    }

    /**
     * Filters are in reverse order !!
     **/
    function makeChildren(requests, filters) {

        var children = [];

        if (filters.length > 0) {

            var filter_name = filters[0];

            var divided_lists = {};

            // Divide the requests by filter name
            for (var index in requests) {
                var request = requests[index];
                if (!divided_lists[request[filter_name]]) {
                    divided_lists[request[filter_name]] = [];
                }
                divided_lists[request[filter_name]].push(request);
            }

            // Create children per divided list of requests
            for (var index in divided_lists) {

                // move to next filter
                children.push({
                    filter_name: filter_name,
                    name: index,
                    children: makeChildren(divided_lists[index], filters.slice(1))
                })
            }

        } else {
            // For all remaining leafs
            for (var index in requests) {
                children.push({
                    name: "" + requests[index].time + "ms",
                    size: requests[index].time,
                    index: requests[index].index,
                    url: requests[index].url
                });
            }
        }

        return children;
    }


    window.addEventListener('dataChanged', function() {
        if (!window.har_data || !window.filter_data) return;

        var chartData = {
            name: '',
            children: makeChildren(window.filter_data, window.filter_settings)
        };

        drawChart(chartData);

    });


    var getLocation = function(href) {
        var l = document.createElement("a");
        l.href = href;
        return l;
    };

    window.filter_settings = [];



    $('#render').click((e) => {

        $('select').each(function() {

            //  console.log($(this).val());
            window.filter_settings.push($(this).val());
        });

        //console.log(window.filter_settings);

        window.dispatchEvent(new CustomEvent('dataChanged'));
    });




    $('#upload').change((e) => {
        var f = e.target.files[0];
        if (f) {
            var r = new FileReader();
            r.onload = function(e) {
                window.filter_data = [];
                window.har_data = $.parseJSON(e.target.result);
                $.each(har_data.log.entries, function(index, value) {

                    var type = 'Not set';


                    if (value.response.content['mimeType']) {

                        if (value.response.content.mimeType.indexOf(';') > 0) {
                            type = value.response.content.mimeType.substring(0, value.response.content.mimeType.indexOf(';'));
                        } else {
                            type = value.response.content.mimeType;
                        }

                    }

                    if (type == 'Not set') {
                        var url_lower = value.request.url.toLowerCase();
                        if (url_lower.indexOf('\.js') > 0) {
                            type = 'text/javascript';
                        }
                        if (url_lower.indexOf('\.jpg') > 0) {
                            type = 'image/jpg';
                        }
                        if (url_lower.indexOf('\.jpeg') > 0) {
                            type = 'image/jpeg';
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
                        time: Math.trunc(value.time),
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
    $("#styled_upload").click(function() {
        $("#upload").click();
        return false;
    });
});
