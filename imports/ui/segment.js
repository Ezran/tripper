import { Template } from 'meteor/templating';
import { Nodes } from '../api/db.js';

import './segment.html';
import { terminal } from '../lib/terminal.js';

Template.trip.events({
    'click .delete' () {
        Nodes.remove(this._id);
    },

    'click .edit' (event) {
        var data = Nodes.find({_id: this._id}).fetch();
        var parent = $(event.target).parent();
        var form = parent.next().children("form");
        //fill form with known data
        form.find("[name=title]").val(data[0].title);
        form.find("[name=travel_type]").val(data[0].travel_type);
        form.find("[name=start_date]").val(data[0].start_date);
        form.find("[name=end_date]").val(data[0].end_date);
        form.find("[name=start_time]").val(data[0].start_time);
        form.find("[name=end_time]").val(data[0].end_time);
        //replace all text with input box and save button html
       parent.css("display", "none");
       parent.next().css("display", "block"); 
       
    },

    'click .end_loc' (event) {
        if (!terminal.isActive()) {
            terminal.setOrigin(this._id);
            terminal.setActive(true);
        }
        else 
            terminal.setActive(false);
    },

    'click .save' (event) {
        //update db with input boxes
        var data = $(event.target).prev().serializeArray().reduce((obj, item) => {
            obj[item.name] = item.value;
            return obj;
        }, {}); 
        if (data.travel_type == "none")
            data.travel_type = null;
        Nodes.update({_id: this._id}, {$set: {
            title: data.title,
            travel_type: data.travel_type,
            start_date: data.start_date,
            end_date: data.end_date,
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