import { Template } from 'meteor/templating';

import './body.html';
import './segment.js';

import '../style/main.css';
import { Markers } from '../api/db.js';

Template.body.helpers ({
    trips() {
        return Markers.find({});
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
        google.maps.event.addListener(map.instance, 'click', (event) => {
            Markers.insert({ lat: event.latLng.lat(), lng: event.latLng.lng()});
        });

        var markers = {};

        var infowindow = new google.maps.InfoWindow({
            content: "Hello world!"
        });

        Markers.find().observe({
            added: (document) => {
                //create marker for this document
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
                    Markers.update(marker.id, { $set: { lat: event.latLng.lat(), lng: event.latLng.lng()}});
                });

                //listener to make markers clickable
                marker.addListener('click', (event) => {
                    var tmp = Markers.find({_id: marker.id}).fetch(); //temp var to get marker info, then show new info
                    infowindow.setContent("id: " + marker.id + " at &lt;" + tmp[0].lat + ", " + tmp[0].lng + "&gt;");
                    infowindow.open(map, marker);
                });

                //store the marker instance
                markers[document._id] = marker;
            },
            
            changed: (newDocument, oldDocument) => {
                markers[newDocument._id].setPosition({ lat: newDocument.lat, lng: newDocument.lng });

            },

            removed: (oldDocument) => {
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