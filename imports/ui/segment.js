import { Template } from 'meteor/templating';

import { Markers } from '../api/db.js';

import './segment.html';

Template.trip.events({
    'click .delete' () {
        Markers.remove(this._id);
    },

    'click .edit' () {
        var tmp = document.getElementById("edit-point");
        Markers.update({_id: this._id}, {$set: {
            title: tmp.elements[0].value,
            date: tmp.elements[1].value,
            start_time: tmp.elements[2].value,
            end_time: tmp.elements[3].value
        }});
    }
});