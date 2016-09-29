import { Template } from 'meteor/templating';

import './body.html';
import './segment.js';

import '../style/main.css';
import { Nodes, Paths } from '../api/db.js';
import { terminal } from '../lib/terminal.js';

Template.body.helpers ({
    trips() {
        return Nodes.find({});
    } 
});

Template.map.helpers ({
    mapOptions: () => {
        if(GoogleMaps.loaded()) {
            return {
                center: new google.maps.LatLng(43.439459, -110.764160),
                zoom: 8
            };
        }
    }
});

Template.map.onCreated(() => {
    GoogleMaps.ready('map', (map) => {    
        // -------- vars for listener events and such -----------------
        var rightClickedEvent = false;
        var pathStartAid = new google.maps.Marker({clickable: false, draggable: false});
        var pathEndAid = new google.maps.Marker({clickable: false, dragable: false});
        var pathAid = new google.maps.Polyline({
            clickable: false,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });

        var markers = {};
        var lines = {};
        var infowindow = new google.maps.InfoWindow({
            content: "Hello world!"
        });
        
        // left click listener
        google.maps.event.addListener(map.instance, 'click', (event) => {
            Nodes.insert({ lat: event.latLng.lat(), lng: event.latLng.lng()});
        });

        // right click listener
        google.maps.event.addListener(map.instance, 'rightclick', (event) => {
            //right click to add node, left click to add second node and connect with path
            if (rightClickedEvent == false) {
                rightClickedEvent = true;

                //add marker/polyline visual aid
                pathStartAid.setPosition(event.latLng);
                pathStartAid.setMap(map.instance);
                pathEndAid.setMap(map.instance);
                pathAid.setMap(map.instance);
                google.maps.event.addListener(map.instance, 'mousemove', (event) => {
                    pathEndAid.setPosition({lat: event.latLng.lat(), lng: event.latLng.lng()});
                    pathAid.setPath([pathStartAid.getPosition().toJSON(), event.latLng.toJSON()]);
                });

                //change behavior of left click
                google.maps.event.clearListeners(map.instance, 'click');
                google.maps.event.addListenerOnce(map.instance, 'click', (second_event) => {
                    //add the nodes to the db
                    var first = Nodes.insert({ lat: event.latLng.lat(), lng: event.latLng.lng()});
                    var second = Nodes.insert({ lat: second_event.latLng.lat(), lng: second_event.latLng.lng()});

                    //add the path to the db
                    Paths.insert({ start: first, end: second});

                    //restore old listener, remove mousemove listener and visual aid
                    google.maps.event.addListener(map.instance, 'click', (event) => {
                        Nodes.insert({ lat: event.latLng.lat(), lng: event.latLng.lng()}); 
                    });

                    pathStartAid.setMap(null);
                    pathEndAid.setMap(null);
                    pathAid.setMap(null);
                    google.maps.event.clearListeners(map.instance, 'mousemove');

                    //reset right click
                    rightClickedEvent = false;
                });
            }
        });

        //update the paths on the map
        Paths.find().observe({
            added: (document) => {
                var start = Nodes.find({_id: document.start}).fetch()[0];
                var end = Nodes.find({_id: document.end}).fetch()[0];
                var polyline = new google.maps.Polyline({
                    path: [
                        {lat: start.lat, lng: start.lng},
                        {lat: end.lat, lng: end.lng}],
                    geodesic: true,
                    clickable: true,
                    strokeColor: '#FF0000',
                    strokeOpacity: 1.0,
                    strokeWeight: 4,
                    id: document._id
                });
                //polyline listeners
                polyline.addListener('click', (event) => {
                    var tmp = Paths.find({_id: polyline.id}).fetch(); //temp var to get marker info, then show new info
                    infowindow.setContent("Travel via " + (tmp[0].travelType ? tmp[0].travelType : "No travel type"));
                    infowindow.open(map, polyline);
                    infowindow.setPosition(event.latLng);
                    
                });

                //show polyline by giving it a map instance
                polyline.setMap(map.instance);
                lines[document._id] = polyline;
            },
            changed: (newDocument, oldDocument) => {
                var start = Nodes.find({_id: newDocument.start}).fetch()[0];
                var end = Nodes.find({_id: newDocument.end}).fetch()[0];

                lines[newDocument._id].setPath([{lat: start.lat, lng: start.lng},{lat: end.lat, lng: end.lng}]); 
            },
            removed: (oldDocument) => {
                lines[oldDocument._id].setMap(null);
                delete lines[oldDocument._id];
            }
        });

        Nodes.find().observe({
            added: (document) => {
                var marker = new google.maps.Marker({
                    draggable: true, 
                    animation: google.maps.Animation.DROP, 
                    position: new google.maps.LatLng(document.lat, document.lng),
                    map: map.instance,
                    //store the document _id on the marker in order to update the document within the dragged event
                    id: document._id 
                });

                //listener to make markers draggable
                marker.addListener('dragend', (event) => {
                    Nodes.update(marker.id, { $set: { lat: event.latLng.lat(), lng: event.latLng.lng()}});
                });

                //listener to make markers clickable
                marker.addListener('click', (event) => {
                    if (rightClickedEvent == false) { //bring up the info window 
                        var tmp = Nodes.find({_id: marker.id}).fetch(); //temp var to get marker info, then show new info
                        infowindow.setContent((tmp[0].title ? tmp[0].title : "No name") + " at &lt;" + tmp[0].lat + ", " + tmp[0].lng + "&gt;");
                        infowindow.open(map, marker);
                    }
                    else { //make this marker the path end node 
                        var first = Nodes.insert(pathStartAid.getPosition().toJSON()); //insert the start node
                        Paths.insert({ start: first, end: marker.id}); //insert the path

                        //maintenance to reset right click event and left click event and path aid visuals
                        google.maps.event.clearListeners(map.instance, 'click');
                        google.maps.event.addListener(map.instance, 'click', (event) => {
                            Nodes.insert({ lat: event.latLng.lat(), lng: event.latLng.lng()}); 
                        });

                        pathStartAid.setMap(null);
                        pathEndAid.setMap(null);
                        pathAid.setMap(null);
                        google.maps.event.clearListeners(map.instance, 'mousemove');

                        //reset right click
                        rightClickedEvent = false;
                    }
                });

                //store the marker instance
                markers[document._id] = marker;
            },
            
            changed: (newDocument, oldDocument) => {
                //update marker
                markers[newDocument._id].setPosition({ lat: newDocument.lat, lng: newDocument.lng });

                //for each path that has this node, update each path
                Paths.find({$or: [{start: newDocument._id}, {end: newDocument._id}]})
                     .forEach((path) => {
                         var polyPath = lines[path._id].getPath().getArray();
                         if (path.start == newDocument._id) //start node changed
                            lines[path._id].setPath([{ lat: newDocument.lat, lng: newDocument.lng }, polyPath[1]]);
                         else //end node changed
                             lines[path._id].setPath([polyPath[0], { lat: newDocument.lat, lng: newDocument.lng }]);
                     });
            },

            removed: (oldDocument) => {
                var p = Paths.find({$or: [{start: oldDocument._id}, {end: oldDocument._id}]}).fetch();
                //if marker belongs to 2 paths, connect them into 1 path
                if (p.length == 2) {
                    //extract the 2 start/end nodes that are not the common deleted one
                    var newPath = [];
                    if (p[0].start != oldDocument._id)
                        newPath.push(p[0].start);
                    else if (p[0].end != oldDocument._id)
                        newPath.push(p[0].end);
                    else 
                        console.log("something went wrong with p[0] logic");
                    
                    if (p[1].start != oldDocument._id)
                        newPath.push(p[1].start);
                    else if (p[1].end != oldDocument._id)
                        newPath.push(p[1].end);
                    else 
                        console.log("something went wrong with p[1] logic");
                    //delete both old paths
                    setTimeout(() => {
                        Paths.remove(p[0]._id);
                        Paths.remove(p[1]._id);
                        // ----- this is actually the correct way to do it on the server, as it is trusted code.  Look @ meteor mongo API docs
                        // Paths.remove({
                        //     $or: [
                        //         {_id: p[0]._id}, 
                        //         {_id: p[1]._id}
                        // ]});
                    });
                    //add new path between 2 extracted non-deleted nodes
                    setTimeout(() => {
                        Paths.insert({start: newPath[0], end: newPath[1]});
                    });
                }
                //if marker belongs to 1 path, delete path
                if (p.length == 1) {
                    setTimeout(() => {Paths.remove(p[0]._id); }, 0); //setTimeout hack to force remove to run async, otherwise it doesn't execute
                }
                //take marker off map
                markers[oldDocument._id].setMap(null);

                //clear event listener
                google.maps.event.clearInstanceListeners(
                    markers[oldDocument._id]
                );

                //remove marker from array
                delete markers[oldDocument._id];
            } 
        });
    });
});
