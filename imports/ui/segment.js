import { Template } from 'meteor/templating';

import { Markers } from '../api/db.js';

import './segment.html';

Template.trip.events({
    'click .delete' () {
        Markers.remove(this._id);
    },

    'click .edit' (event) {
        var data = Markers.find({_id: this._id}).fetch();
        var parent = $(event.target).parent();
        var form = parent.next().children("form");
        //fill form with known data
        form.find("[name=title]").val(data[0].title);
        form.find("[name=date]").val(data[0].date);
        form.find("[name=start_time]").val(data[0].start_time);
        form.find("[name=end_time]").val(data[0].end_time);
        //replace all text with input box and save button html
       parent.css("display", "none");
       parent.next().css("display", "block"); 
       
    },

    'click .save' (event) {
        //update db with input boxes
        var data = $(event.target).prev().serializeArray().reduce((obj, item) => {
            obj[item.name] = item.value;
            return obj;
        }, {}); 
        Markers.update({_id: this._id}, {$set: {
            title: data.title,
            date: data.date,
            start_time: data.start_time,
            end_time: data.end_time
        }});
        //replace html input with text and edit button
        $(event.target).parent().css("display", "none");
        $(event.target).parent().prev().css("display", "block");
    },

    'click .cancel' (event) {
        //replace html input with text and edit buttons
        $(event.target).parent().css("display", "none");
        $(event.target).parent().prev().css("display", "block");
    }
});